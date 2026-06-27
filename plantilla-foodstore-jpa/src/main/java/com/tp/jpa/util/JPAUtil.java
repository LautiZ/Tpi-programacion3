package com.tp.jpa.util;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

/**
 * Mantiene una única instancia de EntityManagerFactory para toda la
 * aplicación. Se obtiene con getEntityManagerFactory() y se cierra al
 * finalizar con close().
 */
public class JPAUtil {

    private static final String PERSISTENCE_UNIT = "foodstorePU";

    private static EntityManagerFactory emf;

    private JPAUtil() {
    }

    public static EntityManagerFactory getEntityManagerFactory() {
        if (emf == null || !emf.isOpen()) {
            emf = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT);
        }
        return emf;
    }

    public static void close() {
        if (emf != null && emf.isOpen()) {
            emf.close();
        }
    }
}
