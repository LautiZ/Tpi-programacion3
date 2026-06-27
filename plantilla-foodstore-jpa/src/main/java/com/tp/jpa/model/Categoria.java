package com.tp.jpa.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categorias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@ToString(callSuper = true, exclude = {"productos"})
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
public class Categoria extends Base {

    @EqualsAndHashCode.Include
    @Column(name = "nombre", nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    @Builder.Default
    private Set<Producto> productos = new HashSet<>();

    public void addProducto(Producto producto) {
        if (!productos.add(producto)) {
            throw new IllegalArgumentException("Producto ya cargado en la categoría");
        }
    }
}
