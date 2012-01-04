package com.antoniogarrote.webidgenerator;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.params.RSAKeyGenerationParameters;
import org.bouncycastle.crypto.generators.RSAKeyPairGenerator;
import org.bouncycastle.jce.provider.JDKKeyPairGenerator;

import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;

/**
 * User: Antonio Garrote
 * Date: 07/11/2011
 * Time: 15:52
 */
public class RSAGenerator {
    public static KeyPair generate(int keySize) {
        JDKKeyPairGenerator.RSA gen = new JDKKeyPairGenerator.RSA();
        gen.initialize(keySize, new java.security.SecureRandom());

        //RSAKeyPairGenerator gen = new RSAKeyPairGenerator();
        //gen.init(new RSAKeyGenerationParameters(new BigInteger("10001", 16), SecureRandom.getInstance("SHA1PRNG"), keySize, 80));

        return gen.generateKeyPair();
    }

    public static KeyPair generate() throws NoSuchAlgorithmException {
        return generate(2048);
    }

    public static void main(String[] args) {
        try {
            System.out.println("TESTING GENERATION: "+RSAGenerator.generate());
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }
}
