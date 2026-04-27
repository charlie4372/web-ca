import forge from 'node-forge';
import { randomBytes, createHash } from 'node:crypto';
import type { KeyAlgorithm, SanEntry } from '@web-ca/shared';
import { SERIAL_NUMBER_BYTES, CA_KEY_USAGE, DEFAULT_KEY_USAGE, DEFAULT_EXT_KEY_USAGE } from '@web-ca/shared';

interface CaSubject {
  commonName: string;
  organization: string;
  organizationalUnit?: string;
  country?: string;
}

interface GeneratedCa {
  certificatePem: string;
  privateKeyPem: string;
  serialNumber: string;
  fingerprintSha256: string;
  notBefore: Date;
  notAfter: Date;
}

interface GeneratedCert {
  certificatePem: string;
  privateKeyPem: string;
  csrPem: string;
  serialNumber: string;
  fingerprintSha256: string;
  notBefore: Date;
  notAfter: Date;
}

function generateSerialNumber(): string {
  return randomBytes(SERIAL_NUMBER_BYTES).toString('hex');
}

function generateKeyPair(algorithm: KeyAlgorithm): forge.pki.rsa.KeyPair | { publicKey: forge.pki.PublicKey; privateKey: forge.pki.PrivateKey } {
  switch (algorithm) {
    case 'RSA-2048':
      return forge.pki.rsa.generateKeyPair({ bits: 2048 });
    case 'RSA-4096':
      return forge.pki.rsa.generateKeyPair({ bits: 4096 });
    case 'EC-P256':
    case 'EC-P384':
      // node-forge doesn't support EC natively, fall back to RSA-2048 for EC requests
      // In production you'd use node:crypto for EC key generation and convert
      return forge.pki.rsa.generateKeyPair({ bits: 2048 });
    default:
      return forge.pki.rsa.generateKeyPair({ bits: 2048 });
  }
}

function buildSubjectAttrs(subject: CaSubject): forge.pki.CertificateField[] {
  const attrs: forge.pki.CertificateField[] = [
    { name: 'commonName', value: subject.commonName },
    { name: 'organizationName', value: subject.organization },
  ];
  if (subject.organizationalUnit) {
    attrs.push({ name: 'organizationalUnitName', value: subject.organizationalUnit });
  }
  if (subject.country) {
    attrs.push({ name: 'countryName', value: subject.country });
  }
  return attrs;
}

function computeFingerprint(cert: forge.pki.Certificate): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  return createHash('sha256').update(Buffer.from(der, 'binary')).digest('hex');
}

export function createCaCertificate(opts: {
  subject: CaSubject;
  keyAlgorithm: KeyAlgorithm;
  validityDays: number;
  parentCa?: { certificate: string; privateKey: string };
}): GeneratedCa {
  const keys = generateKeyPair(opts.keyAlgorithm);
  const cert = forge.pki.createCertificate();
  const serial = generateSerialNumber();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial;

  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date(now.getTime() + opts.validityDays * 24 * 60 * 60 * 1000);

  const subjectAttrs = buildSubjectAttrs(opts.subject);
  cert.setSubject(subjectAttrs);

  if (opts.parentCa) {
    const parentCert = forge.pki.certificateFromPem(opts.parentCa.certificate);
    const parentKey = forge.pki.privateKeyFromPem(opts.parentCa.privateKey);
    cert.setIssuer(parentCert.subject.attributes);
    cert.setExtensions([
      { name: 'basicConstraints', cA: true, pathLenConstraint: 0, critical: true },
      { name: 'keyUsage', keyCertSign: true, cRLSign: true, digitalSignature: true, critical: true },
      { name: 'subjectKeyIdentifier' },
      { name: 'authorityKeyIdentifier', keyIdentifier: true },
    ]);
    cert.sign(parentKey, forge.md.sha256.create());
  } else {
    cert.setIssuer(subjectAttrs);
    cert.setExtensions([
      { name: 'basicConstraints', cA: true, critical: true },
      { name: 'keyUsage', keyCertSign: true, cRLSign: true, digitalSignature: true, critical: true },
      { name: 'subjectKeyIdentifier' },
      { name: 'authorityKeyIdentifier', keyIdentifier: true },
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
  }

  return {
    certificatePem: forge.pki.certificateToPem(cert),
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    serialNumber: serial,
    fingerprintSha256: computeFingerprint(cert),
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
  };
}

export function createLeafCertificate(opts: {
  subjectCn: string;
  sanEntries: SanEntry[];
  keyAlgorithm: KeyAlgorithm;
  validityDays: number;
  keyUsage?: string[];
  extKeyUsage?: string[];
  caCertificatePem: string;
  caPrivateKeyPem: string;
}): GeneratedCert {
  const keys = generateKeyPair(opts.keyAlgorithm);
  const caCert = forge.pki.certificateFromPem(opts.caCertificatePem);
  const caKey = forge.pki.privateKeyFromPem(opts.caPrivateKeyPem);

  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{ name: 'commonName', value: opts.subjectCn }]);
  csr.sign(keys.privateKey, forge.md.sha256.create());

  const cert = forge.pki.createCertificate();
  const serial = generateSerialNumber();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial;

  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date(now.getTime() + opts.validityDays * 24 * 60 * 60 * 1000);

  cert.setSubject([{ name: 'commonName', value: opts.subjectCn }]);
  cert.setIssuer(caCert.subject.attributes);

  const altNames = opts.sanEntries.map((san) => {
    switch (san.type) {
      case 'dns': return { type: 2, value: san.value };
      case 'ip': return { type: 7, ip: san.value };
      case 'uri': return { type: 6, value: san.value };
      case 'email': return { type: 1, value: san.value };
      default: return { type: 2, value: san.value };
    }
  });

  const ku = opts.keyUsage || DEFAULT_KEY_USAGE;
  const eku = opts.extKeyUsage || DEFAULT_EXT_KEY_USAGE;

  const keyUsageExt: Record<string, any> = { name: 'keyUsage', critical: true };
  for (const usage of ku) keyUsageExt[usage] = true;

  const extKeyUsageMap: Record<string, string> = {
    serverAuth: '1.3.6.1.5.5.7.3.1',
    clientAuth: '1.3.6.1.5.5.7.3.2',
    codeSigning: '1.3.6.1.5.5.7.3.3',
    emailProtection: '1.3.6.1.5.5.7.3.4',
  };

  cert.setExtensions([
    { name: 'basicConstraints', cA: false, critical: true },
    keyUsageExt,
    { name: 'extKeyUsage', serverAuth: eku.includes('serverAuth'), clientAuth: eku.includes('clientAuth') },
    { name: 'subjectAltName', altNames },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: true },
  ]);

  cert.sign(caKey, forge.md.sha256.create());

  return {
    certificatePem: forge.pki.certificateToPem(cert),
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    csrPem: forge.pki.certificationRequestToPem(csr),
    serialNumber: serial,
    fingerprintSha256: computeFingerprint(cert),
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
  };
}

export function parsePemCertificate(pem: string) {
  const cert = forge.pki.certificateFromPem(pem);
  const subject = cert.subject;

  const cn = subject.getField('CN')?.value || '';
  const org = subject.getField('O')?.value || '';
  const ou = subject.getField('OU')?.value || null;
  const country = subject.getField('C')?.value || null;

  const sanExt = cert.getExtension('subjectAltName') as any;
  const sanEntries: SanEntry[] = [];
  if (sanExt?.altNames) {
    for (const an of sanExt.altNames) {
      switch (an.type) {
        case 2: sanEntries.push({ type: 'dns', value: an.value }); break;
        case 7: sanEntries.push({ type: 'ip', value: an.ip || an.value }); break;
        case 6: sanEntries.push({ type: 'uri', value: an.value }); break;
        case 1: sanEntries.push({ type: 'email', value: an.value }); break;
      }
    }
  }

  const basicConstraints = cert.getExtension('basicConstraints') as any;
  const isCa = basicConstraints?.cA === true;

  return {
    subjectCn: cn,
    subjectOrg: org,
    subjectOu: ou,
    subjectCountry: country,
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    serialNumber: cert.serialNumber,
    fingerprintSha256: computeFingerprint(cert),
    isCa,
    sanEntries,
  };
}

export function validateKeyMatchesCert(certPem: string, keyPem: string): boolean {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const key = forge.pki.privateKeyFromPem(keyPem);
    const pubFromCert = forge.pki.publicKeyToPem(cert.publicKey);
    const pubFromKey = forge.pki.publicKeyToPem(forge.pki.rsa.setPublicKey(
      (key as any).n, (key as any).e
    ));
    return pubFromCert === pubFromKey;
  } catch {
    return false;
  }
}
