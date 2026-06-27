package com.tp.jpa.model;

import com.tp.jpa.model.enums.EstadoPedido;
import com.tp.jpa.model.enums.FormaPago;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@ToString(callSuper = true, exclude = {"detalles"})
@EqualsAndHashCode(callSuper = true)
public class Pedido extends Base implements Calculable {

    @Column(name = "fecha", updatable = false)
    @Builder.Default
    private LocalDate fecha = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "estado",nullable = false, length = 30)
    @Builder.Default
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @Column(name = "total", nullable = false)
    @Builder.Default
    private Double total = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pago",nullable = false, length = 20)
    private FormaPago formaPago;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    @Builder.Default
    private Set<DetallePedido> detalles = new HashSet<>();

    public void addDetallePedido(int cantidad, Producto producto) {
        DetallePedido detalle = DetallePedido.builder()
                .cantidad(cantidad)
                .producto(producto)
                .subtotal(producto.getPrecio() * cantidad)
                .build();

        this.detalles.add(detalle);
        this.total += detalle.getSubtotal();
    }

    @Override
    public void calcularTotal() {
        double acumulador = 0.0;
        for (DetallePedido detalle : detalles) {
            if (detalle.getSubtotal() != null) {
                acumulador += detalle.getSubtotal();
            }
        }
        this.total = acumulador;
    }

    public DetallePedido findDetallePedidoByProducto(Producto producto) {
        for (DetallePedido detalle : detalles) {
            if (detalle.getProducto() != null &&
                    detalle.getProducto().getId().equals(producto.getId())) {
                return detalle;
            }
        }
        return null;
    }

    public void deleteDetallePedidoByProducto(Producto producto) {
        DetallePedido detalleEncotrado = findDetallePedidoByProducto(producto);
        if (detalleEncotrado != null) {
            detalles.remove(detalleEncotrado);
            calcularTotal();
        }
    }
}
