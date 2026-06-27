package com.tp.jpa.repository;

import com.tp.jpa.model.Categoria;

/**
 * Repositorio de Categoria. Hereda todo el CRUD de BaseRepository; no
 * requiere métodos adicionales.
 */
public class CategoriaRepository extends BaseRepository<Categoria> {

    public CategoriaRepository() {
        super(Categoria.class);
    }
}
