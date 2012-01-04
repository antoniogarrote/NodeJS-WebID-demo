package com.antoniogarrote.webidgenerator;

import org.bouncycastle.asn1.ASN1Object;
import org.bouncycastle.asn1.ASN1Sequence;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.asn1.x509.GeneralName;
import org.bouncycastle.asn1.x509.GeneralNames;
import org.bouncycastle.asn1.x509.X509Extension;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * User: Antonio Garrote
 * Date: 07/11/2011
 * Time: 16:06
 */
public class SelfSignedCertficateGenerator {
    public static X509CertificateHolder generate(KeyPair keypair, String webID) throws OperatorCreationException, IOException, KeyStoreException {
        BigInteger r;
        SecureRandom rnd = new java.security.SecureRandom();
        BigInteger n = new BigInteger(1024,rnd);
        do {
            r = new BigInteger(n.bitLength(), rnd);
        } while (r.compareTo(n) >= 0);
        Security.addProvider(new BouncyCastleProvider());

        PublicKey publicKey = keypair.getPublic();
        PrivateKey privateKey = keypair.getPrivate();

        Date startDate = new Date();
        Date endDate = new SimpleDateFormat("yyyy-MM-dd").parse("2021-12-31", new ParsePosition(0));

        X500NameBuilder nameBuilder = new X500NameBuilder(BCStyle.INSTANCE);

        nameBuilder.addRDN(BCStyle.CN,"Not a Certification Authority");
        nameBuilder.addRDN(BCStyle.OU,"The Community of Self Signers");
        nameBuilder.addRDN(BCStyle.O,"FOAF+SSL");

        X500Name issuer = nameBuilder.build();

        nameBuilder = new X500NameBuilder(BCStyle.INSTANCE);

        nameBuilder.addRDN(BCStyle.CN,"social.rdf ME Cert "+webID);
        nameBuilder.addRDN(BCStyle.OU,"The Community of Self Signers");
        nameBuilder.addRDN(BCStyle.O,"FOAF+SSL");

        X500Name subject = nameBuilder.build();

        SubjectPublicKeyInfo publicKeyInfo = new SubjectPublicKeyInfo((ASN1Sequence) ASN1Object.fromByteArray(publicKey.getEncoded()));
        X509v3CertificateBuilder builder = new X509v3CertificateBuilder(issuer,r,startDate,endDate,subject,publicKeyInfo);


        GeneralName name = new GeneralName(GeneralName.uniformResourceIdentifier,webID);
        GeneralNames names = new GeneralNames(name);
        builder.addExtension(X509Extension.subjectAlternativeName,false,names);

        ContentSigner sigGen = new JcaContentSignerBuilder("SHA1withRSA").setProvider("BC").build(privateKey);

        X509CertificateHolder certHolder = builder.build(sigGen);

        return certHolder;
    }

    public static void main(String[] args) {
        try {
            String webID = args[0];
            String certificatePath = args[1];
            String keyStorePassword = args[2];
            KeyPair keys = RSAGenerator.generate(2048);

            X509CertificateHolder certHolder = SelfSignedCertficateGenerator.generate(keys,webID);
            java.security.cert.X509Certificate cert = new JcaX509CertificateConverter().setProvider("BC").getCertificate(certHolder);
            //System.out.println("CERT:"+cert);


            BigInteger exponent = ((RSAPublicKey) keys.getPublic()).getPublicExponent();
            BigInteger modulus = ((RSAPublicKey) keys.getPublic()).getModulus();

            //System.out.println("EXPONENT:" + ((RSAPublicKey) keys.getPublic()).getPublicExponent());
            //System.out.println("MODULUS:"+((RSAPublicKey) keys.getPublic()).getModulus());

            // verify, just in case
            cert.verify(keys.getPublic());

            /*
            PEMWriter w = new PEMWriter(new FileWriter(certificatePath));
            w.writeObject(cert);
            w.close();
            */

            KeyStore store = KeyStore.getInstance("PKCS12","BC");
            store.load(null,null);


            java.security.cert.Certificate[] chain = {cert};


            store.setKeyEntry("private",keys.getPrivate(),null,chain);

            FileOutputStream fout = new FileOutputStream(certificatePath);

            store.store(fout, keyStorePassword.toCharArray());
            fout.close();

            System.out.println("{\"location\": \""+certificatePath+"\"," +
                                "\"modulus\": \""+modulus.toString(16)+"\"," +
                                "\"exponent\": \""+exponent+"\"," +
                                "\"uri\": \""+webID+"\"}");

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("null");
        }
    }
}
