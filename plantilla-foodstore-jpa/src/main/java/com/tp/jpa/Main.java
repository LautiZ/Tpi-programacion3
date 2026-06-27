package com.tp.jpa;

import com.tp.jpa.model.*;
import com.tp.jpa.model.enums.EstadoPedido;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.PedidoRepository;
import com.tp.jpa.repository.ProductoRepository;
import com.tp.jpa.repository.UsuarioRepository;
import com.tp.jpa.util.JPAUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;

import java.util.*;

public class Main {

    private static final Scanner sc = new Scanner(System.in);

    private static final CategoriaRepository categoriaRepo = new CategoriaRepository();
    private static final ProductoRepository productoRepo = new ProductoRepository();
    private static final UsuarioRepository usuarioRepo = new UsuarioRepository();
    private static final PedidoRepository pedidoRepo = new PedidoRepository();

    public static void main(String[] args) {
        boolean salir = false;
        while (!salir) {
            System.out.println();
            System.out.println("===== FOOD STORE - MENU PRINCIPAL =====");
            System.out.println("1. Gestionar Categorias");
            System.out.println("2. Gestionar Productos");
            System.out.println("3. Gestionar Usuarios");
            System.out.println("4. Gestionar Pedidos");
            System.out.println("5. Reportes");
            System.out.println("0. Salir");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1": menuCategorias(); break;
                case "2": menuProductos(); break;
                case "3": menuUsuarios(); break;
                case "4": menuPedidos(); break;
                case "5": menuReportes(); break;
                case "0": salir = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
        JPAUtil.close();
        System.out.println("Aplicacion finalizada.");
    }

    // ── CATEGORÍAS ───────────────────────────────────────────────────────────

    private static void menuCategorias() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n----- Gestion de Categorias -----");
            System.out.println("1. Alta");
            System.out.println("2. Modificar");
            System.out.println("3. Baja logica");
            System.out.println("4. Listado");
            System.out.println("0. Volver");
            System.out.print("Opcion: ");
            switch (sc.nextLine().trim()) {
                case "1": altaCategoria(); break;
                case "2": modificarCategoria(); break;
                case "3": bajaCategoria(); break;
                case "4": listarCategorias(); break;
                case "0": volver = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private static void altaCategoria() {
        System.out.print("Nombre (obligatorio): ");
        String nombre = sc.nextLine().trim();
        if (nombre.isEmpty()) {
            System.out.println("Error: el nombre es obligatorio.");
            return;
        }
        System.out.print("Descripcion (Enter para omitir): ");
        String descripcion = sc.nextLine().trim();

        Categoria c = Categoria.builder()
                .nombre(nombre)
                .descripcion(descripcion.isEmpty() ? null : descripcion)
                .build();
        Categoria guardada = categoriaRepo.guardar(c);
        System.out.println("Categoria creada con ID: " + guardada.getId());
    }

    private static void modificarCategoria() {
        List<Categoria> activas = categoriaRepo.listarActivos();
        if (activas.isEmpty()) {
            System.out.println("No hay categorias activas.");
            return;
        }
        imprimirCategorias(activas);
        System.out.print("ID a modificar: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }

        Optional<Categoria> opt = categoriaRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            System.out.println("Categoria no encontrada.");
            return;
        }
        Categoria c = opt.get();

        System.out.println("Nombre actual: " + c.getNombre());
        System.out.print("Nuevo nombre (Enter para conservar): ");
        String nombre = sc.nextLine().trim();
        if (!nombre.isEmpty()) c.setNombre(nombre);

        System.out.println("Descripcion actual: " + c.getDescripcion());
        System.out.print("Nueva descripcion (Enter para conservar): ");
        String desc = sc.nextLine().trim();
        if (!desc.isEmpty()) c.setDescripcion(desc);

        categoriaRepo.guardar(c);
        System.out.println("Categoria actualizada.");
    }

    private static void bajaCategoria() {
        System.out.print("ID de categoria a dar de baja: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        Optional<Categoria> opt = categoriaRepo.buscarPorId(id);
        if (!categoriaRepo.eliminarLogico(id)) {
            System.out.println("Error: categoria no encontrada o ya dada de baja.");
        } else {
            System.out.println("Categoria \"" + opt.map(Categoria::getNombre).orElse("") + "\" dada de baja.");
        }
    }

    private static void listarCategorias() {
        List<Categoria> activas = categoriaRepo.listarActivos();
        if (activas.isEmpty()) {
            System.out.println("No hay categorias activas.");
            return;
        }
        imprimirCategorias(activas);
    }

    // ── PRODUCTOS ────────────────────────────────────────────────────────────

    private static void menuProductos() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n----- Gestion de Productos -----");
            System.out.println("1. Alta");
            System.out.println("2. Modificar");
            System.out.println("3. Baja logica");
            System.out.println("4. Listado");
            System.out.println("0. Volver");
            System.out.print("Opcion: ");
            switch (sc.nextLine().trim()) {
                case "1": altaProducto(); break;
                case "2": modificarProducto(); break;
                case "3": bajaProducto(); break;
                case "4": listarProductos(); break;
                case "0": volver = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private static void altaProducto() {
        List<Categoria> cats = categoriaRepo.listarActivos();
        if (cats.isEmpty()) {
            System.out.println("No hay categorias activas. Cree una categoria primero.");
            return;
        }
        imprimirCategorias(cats);
        System.out.print("ID de categoria: ");
        Long catId = parseLong(sc.nextLine().trim());
        if (catId == null) { System.out.println("ID invalido."); return; }
        final Long cid = catId;
        if (cats.stream().noneMatch(c -> c.getId().equals(cid))) {
            System.out.println("Categoria no encontrada.");
            return;
        }

        System.out.print("Nombre (obligatorio): ");
        String nombre = sc.nextLine().trim();
        if (nombre.isEmpty()) { System.out.println("El nombre es obligatorio."); return; }

        System.out.print("Descripcion (Enter para omitir): ");
        String desc = sc.nextLine().trim();

        System.out.print("Precio (mayor a 0): ");
        Double precio = parseDouble(sc.nextLine().trim());
        if (precio == null || precio <= 0) { System.out.println("Precio invalido."); return; }

        System.out.print("Stock (mayor o igual a 0): ");
        Integer stock = parseInt(sc.nextLine().trim());
        if (stock == null || stock < 0) { System.out.println("Stock invalido."); return; }

        System.out.print("Imagen (Enter para omitir): ");
        String imagen = sc.nextLine().trim();

        System.out.print("Disponible? (S/N, Enter = S): ");
        String dispStr = sc.nextLine().trim();
        boolean disponible = !dispStr.equalsIgnoreCase("N");

        // Single EM: find managed Categoria, add Producto to its set, cascade persists it
        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            Categoria cat = em.find(Categoria.class, catId);
            Producto p = Producto.builder()
                    .nombre(nombre)
                    .descripcion(desc.isEmpty() ? null : desc)
                    .precio(precio)
                    .stock(stock)
                    .imagen(imagen.isEmpty() ? null : imagen)
                    .disponible(disponible)
                    .build();
            // Adding to a managed PersistentSet triggers lazy load and marks the collection dirty.
            // Cascade ALL on Categoria.productos ensures Hibernate inserts p with categoria_id set at flush.
            boolean agregado = cat.getProductos().add(p);
            if (!agregado) {
                tx.rollback();
                System.out.println("Error: ya existe un producto con ese nombre en la categoria \"" + cat.getNombre() + "\".");
                return;
            }
            tx.commit();
            System.out.println("Producto creado con ID: " + p.getId() + " | Categoria: " + cat.getNombre());
        } catch (RuntimeException e) {
            if (tx.isActive()) tx.rollback();
            System.out.println("Error al guardar producto: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    private static void modificarProducto() {
        List<Producto> activos = productoRepo.listarActivos();
        if (activos.isEmpty()) {
            System.out.println("No hay productos activos.");
            return;
        }
        imprimirProductos(activos);
        System.out.print("ID a modificar: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }

        Optional<Producto> opt = productoRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            System.out.println("Producto no encontrado.");
            return;
        }
        Producto p = opt.get();

        System.out.println("Nombre actual: " + p.getNombre());
        System.out.print("Nuevo nombre (Enter para conservar): ");
        String nombre = sc.nextLine().trim();
        if (!nombre.isEmpty()) p.setNombre(nombre);

        System.out.println("Precio actual: " + p.getPrecio());
        System.out.print("Nuevo precio (Enter para conservar): ");
        String precioStr = sc.nextLine().trim();
        if (!precioStr.isEmpty()) {
            Double precio = parseDouble(precioStr);
            if (precio == null || precio <= 0) System.out.println("Precio invalido, no se actualizo.");
            else p.setPrecio(precio);
        }

        System.out.println("Stock actual: " + p.getStock());
        System.out.print("Nuevo stock (Enter para conservar): ");
        String stockStr = sc.nextLine().trim();
        if (!stockStr.isEmpty()) {
            Integer stock = parseInt(stockStr);
            if (stock == null || stock < 0) System.out.println("Stock invalido, no se actualizo.");
            else p.setStock(stock);
        }

        productoRepo.guardar(p);
        System.out.println("Producto actualizado.");
    }

    private static void bajaProducto() {
        System.out.print("ID de producto a dar de baja: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        Optional<Producto> opt = productoRepo.buscarPorId(id);
        if (!productoRepo.eliminarLogico(id)) {
            System.out.println("Error: producto no encontrado o ya dado de baja.");
        } else {
            System.out.println("Producto \"" + opt.map(Producto::getNombre).orElse("") + "\" dado de baja.");
        }
    }

    private static void listarProductos() {
        List<Categoria> cats = categoriaRepo.listarActivos();
        System.out.printf("%-5s %-25s %-10s %-6s %-13s %-20s%n",
                "ID", "Nombre", "Precio", "Stock", "Disponible", "Categoria");
        System.out.println("-".repeat(83));
        boolean hayProductos = false;
        for (Categoria cat : cats) {
            for (Producto p : productoRepo.buscarPorCategoria(cat.getId())) {
                System.out.printf("%-5d %-25s %-10.2f %-6d %-13s %-20s%n",
                        p.getId(), p.getNombre(), p.getPrecio(), p.getStock(),
                        Boolean.TRUE.equals(p.getDisponible()) ? "Disponible" : "No disp.",
                        cat.getNombre());
                hayProductos = true;
            }
        }
        if (!hayProductos) System.out.println("No hay productos activos.");
    }

    // ── USUARIOS ─────────────────────────────────────────────────────────────

    private static void menuUsuarios() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n----- Gestion de Usuarios -----");
            System.out.println("1. Alta");
            System.out.println("2. Modificar");
            System.out.println("3. Baja logica");
            System.out.println("4. Listado");
            System.out.println("5. Buscar por mail");
            System.out.println("0. Volver");
            System.out.print("Opcion: ");
            switch (sc.nextLine().trim()) {
                case "1": altaUsuario(); break;
                case "2": modificarUsuario(); break;
                case "3": bajaUsuario(); break;
                case "4": listarUsuarios(); break;
                case "5": buscarUsuarioPorMail(); break;
                case "0": volver = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private static void altaUsuario() {
        System.out.print("Nombre: ");
        String nombre = sc.nextLine().trim();
        System.out.print("Apellido: ");
        String apellido = sc.nextLine().trim();
        System.out.print("Mail: ");
        String mail = sc.nextLine().trim();
        System.out.print("Celular (Enter para omitir): ");
        String celular = sc.nextLine().trim();
        System.out.print("Contraseña: ");
        String contrasena = sc.nextLine().trim();
        System.out.println("Rol: 1-ADMIN  2-USUARIO");
        System.out.print("Opcion: ");
        Rol rol = "1".equals(sc.nextLine().trim()) ? Rol.ADMIN : Rol.USUARIO;

        if (usuarioRepo.buscarPorMail(mail).isPresent()) {
            System.out.println("Error: ya existe un usuario activo con ese mail.");
            return;
        }

        Usuario u = Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .mail(mail)
                .celular(celular.isEmpty() ? null : celular)
                .contraseña(contrasena)
                .rol(rol)
                .build();
        Usuario guardado = usuarioRepo.guardar(u);
        System.out.println("Usuario creado con ID: " + guardado.getId());
    }

    private static void modificarUsuario() {
        List<Usuario> activos = usuarioRepo.listarActivos();
        if (activos.isEmpty()) {
            System.out.println("No hay usuarios activos.");
            return;
        }
        imprimirUsuarios(activos);
        System.out.print("ID a modificar: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }

        Optional<Usuario> opt = usuarioRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            System.out.println("Usuario no encontrado.");
            return;
        }
        Usuario u = opt.get();

        System.out.println("Nombre actual: " + u.getNombre());
        System.out.print("Nuevo nombre (Enter para conservar): ");
        String nombre = sc.nextLine().trim();
        if (!nombre.isEmpty()) u.setNombre(nombre);

        System.out.println("Apellido actual: " + u.getApellido());
        System.out.print("Nuevo apellido (Enter para conservar): ");
        String apellido = sc.nextLine().trim();
        if (!apellido.isEmpty()) u.setApellido(apellido);

        System.out.println("Mail actual: " + u.getMail());
        System.out.print("Nuevo mail (Enter para conservar): ");
        String mail = sc.nextLine().trim();
        if (!mail.isEmpty()) {
            Optional<Usuario> existing = usuarioRepo.buscarPorMail(mail);
            if (existing.isPresent() && !existing.get().getId().equals(u.getId())) {
                System.out.println("Error: ese mail ya esta en uso por otro usuario activo.");
            } else {
                u.setMail(mail);
            }
        }

        System.out.println("Celular actual: " + u.getCelular());
        System.out.print("Nuevo celular (Enter para conservar): ");
        String celular = sc.nextLine().trim();
        if (!celular.isEmpty()) u.setCelular(celular);

        System.out.print("Nueva contraseña (Enter para conservar): ");
        String contrasena = sc.nextLine().trim();
        if (!contrasena.isEmpty()) u.setContraseña(contrasena);

        usuarioRepo.guardar(u);
        System.out.println("Usuario actualizado.");
    }

    private static void bajaUsuario() {
        System.out.print("ID de usuario a dar de baja: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID inválido."); return; }
        Optional<Usuario> opt = usuarioRepo.buscarPorId(id);
        if (!usuarioRepo.eliminarLogico(id)) {
            System.out.println("Error: usuario no encontrado o ya dado de baja.");
        } else {
            opt.ifPresent(u -> System.out.println(
                    "Usuario \"" + u.getNombre() + " " + u.getApellido() + "\" dado de baja. Sus pedidos permanecen en el sistema."));
        }
    }

    private static void listarUsuarios() {
        List<Usuario> activos = usuarioRepo.listarActivos();
        if (activos.isEmpty()) {
            System.out.println("No hay usuarios activos.");
            return;
        }
        imprimirUsuarios(activos);
    }

    private static void buscarUsuarioPorMail() {
        System.out.print("Mail a buscar: ");
        String mail = sc.nextLine().trim();
        Optional<Usuario> opt = usuarioRepo.buscarPorMail(mail);
        if (opt.isEmpty()) {
            System.out.println("No existe usuario activo con ese mail.");
        } else {
            Usuario u = opt.get();
            System.out.println("ID:       " + u.getId());
            System.out.println("Nombre:   " + u.getNombre() + " " + u.getApellido());
            System.out.println("Mail:     " + u.getMail());
            System.out.println("Celular:  " + u.getCelular());
            System.out.println("Rol:      " + u.getRol());
        }
    }

    // ── PEDIDOS ──────────────────────────────────────────────────────────────

    private static void menuPedidos() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n----- Gestion de Pedidos -----");
            System.out.println("1. Alta de pedido");
            System.out.println("2. Cambiar estado");
            System.out.println("3. Baja logica");
            System.out.println("4. Listado");
            System.out.println("5. Pedidos por usuario");
            System.out.println("6. Pedidos por estado");
            System.out.println("0. Volver");
            System.out.print("Opcion: ");
            switch (sc.nextLine().trim()) {
                case "1": altaPedido(); break;
                case "2": cambiarEstadoPedido(); break;
                case "3": bajaPedido(); break;
                case "4": listarPedidos(); break;
                case "5": pedidosPorUsuario(); break;
                case "6": pedidosPorEstado(); break;
                case "0": volver = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private static void altaPedido() {
        List<Usuario> usuarios = usuarioRepo.listarActivos();
        if (usuarios.isEmpty()) {
            System.out.println("No hay usuarios activos. Cree un usuario primero.");
            return;
        }
        imprimirUsuarios(usuarios);
        System.out.print("ID de usuario: ");
        Long usuarioId = parseLong(sc.nextLine().trim());
        if (usuarioId == null) { System.out.println("ID invalido."); return; }
        final Long uid = usuarioId;
        if (usuarios.stream().noneMatch(u -> u.getId().equals(uid))) {
            System.out.println("Usuario no encontrado.");
            return;
        }

        System.out.println("Forma de pago: 1-TARJETA  2-TRANSFERENCIA  3-EFECTIVO");
        System.out.print("Opcion: ");
        FormaPago formaPago;
        switch (sc.nextLine().trim()) {
            case "1": formaPago = FormaPago.TARJETA; break;
            case "2": formaPago = FormaPago.TRANSFERENCIA; break;
            case "3": formaPago = FormaPago.EFECTIVO; break;
            default: System.out.println("Forma de pago invalida."); return;
        }

        // Build in-memory list: only IDs and quantities, no managed entities from other EMs
        List<long[]> items = new ArrayList<>();
        boolean agregando = true;
        while (agregando) {
            List<Producto> disponibles = productoRepo.listarActivos().stream()
                    .filter(p -> Boolean.TRUE.equals(p.getDisponible()) && p.getStock() > 0)
                    .toList();
            if (disponibles.isEmpty()) {
                System.out.println("No hay productos disponibles con stock.");
                break;
            }
            System.out.printf("%-5s %-25s %-10s %-6s%n", "ID", "Nombre", "Precio", "Stock");
            System.out.println("-".repeat(50));
            for (Producto p : disponibles) {
                System.out.printf("%-5d %-25s %-10.2f %-6d%n",
                        p.getId(), p.getNombre(), p.getPrecio(), p.getStock());
            }

            System.out.print("ID de producto: ");
            Long prodId = parseLong(sc.nextLine().trim());
            if (prodId == null) { System.out.println("ID invalido."); continue; }
            final Long pid = prodId;
            Optional<Producto> optProd = disponibles.stream().filter(p -> p.getId().equals(pid)).findFirst();
            if (optProd.isEmpty()) { System.out.println("Producto no encontrado o no disponible."); continue; }
            Producto prod = optProd.get();

            System.out.print("Cantidad: ");
            Integer cantidad = parseInt(sc.nextLine().trim());
            if (cantidad == null || cantidad <= 0) { System.out.println("Cantidad invalida."); continue; }
            if (cantidad > prod.getStock()) {
                System.out.println("Stock insuficiente. Disponible: " + prod.getStock());
                continue;
            }

            items.add(new long[]{prod.getId(), cantidad});
            System.out.print("Agregar otro producto? (S/N): ");
            agregando = sc.nextLine().trim().equalsIgnoreCase("S");
        }

        if (items.isEmpty()) {
            System.out.println("El pedido debe tener al menos un producto. Operacion cancelada.");
            return;
        }

        // Single EM + single transaction: atomically create order, detalles and reduce stock
        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();

            Usuario usuario = em.find(Usuario.class, usuarioId);
            Pedido pedido = Pedido.builder().formaPago(formaPago).build();

            for (long[] item : items) {
                Producto prod = em.find(Producto.class, item[0]);
                int cantidad = (int) item[1];
                pedido.addDetallePedido(cantidad, prod);
                // prod is managed → stock change auto-syncs at commit, no explicit merge needed
                prod.setStock(prod.getStock() - cantidad);
            }
            pedido.calcularTotal();

            // usuario.addPedido establishes the usuario_id FK via the @OneToMany relationship
            usuario.addPedido(pedido);
            // Explicit persist cascades to DetallePedido via Pedido.detalles cascade = ALL
            em.persist(pedido);

            tx.commit();

            System.out.println("\n===== Pedido Creado =====");
            System.out.println("ID:          " + pedido.getId());
            System.out.println("Fecha:       " + pedido.getFecha());
            System.out.println("Usuario ID:  " + usuarioId);
            System.out.println("Forma pago:  " + pedido.getFormaPago());
            System.out.println("Detalle:");
            for (DetallePedido d : pedido.getDetalles()) {
                System.out.printf("  %-25s x%-4d $%.2f%n",
                        d.getProducto().getNombre(), d.getCantidad(), d.getSubtotal());
            }
            System.out.printf("Total:       $%.2f%n", pedido.getTotal());

        } catch (RuntimeException e) {
            if (tx.isActive()) tx.rollback();
            System.out.println("Error al crear pedido (rollback realizado): " + e.getMessage());
        } finally {
            em.close();
        }
    }

    private static void cambiarEstadoPedido() {
        System.out.print("ID de pedido: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }

        Optional<Pedido> opt = pedidoRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            System.out.println("Pedido no encontrado.");
            return;
        }
        Pedido p = opt.get();
        System.out.println("Estado actual: " + p.getEstado());
        System.out.println("Nuevo estado: 1-PENDIENTE  2-CONFIRMADO  3-TERMINADO  4-CANCELADO");
        System.out.print("Opcion: ");
        EstadoPedido nuevoEstado;
        switch (sc.nextLine().trim()) {
            case "1": nuevoEstado = EstadoPedido.PENDIENTE; break;
            case "2": nuevoEstado = EstadoPedido.CONFIRMADO; break;
            case "3": nuevoEstado = EstadoPedido.TERMINADO; break;
            case "4": nuevoEstado = EstadoPedido.CANCELADO; break;
            default: System.out.println("Opcion invalida."); return;
        }
        p.setEstado(nuevoEstado);
        pedidoRepo.guardar(p);
        System.out.println("Pedido " + p.getId() + " actualizado a: " + nuevoEstado);
    }

    private static void bajaPedido() {
        System.out.print("ID de pedido a dar de baja: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        Optional<Pedido> opt = pedidoRepo.buscarPorId(id);
        if (!pedidoRepo.eliminarLogico(id)) {
            System.out.println("Error: pedido no encontrado o ya dado de baja.");
        } else {
            opt.ifPresent(p -> System.out.printf(
                    "Pedido ID %d dado de baja. Total: $%.2f (stock no restaurado)%n",
                    p.getId(), p.getTotal()));
        }
    }

    private static void listarPedidos() {
        // Build reverse map pedidoId → usuarioNombre since Pedido has no direct User reference
        Map<Long, String> pedidoUsuario = buildPedidoUsuarioMap();
        List<Pedido> pedidos = pedidoRepo.listarActivos();
        if (pedidos.isEmpty()) { System.out.println("No hay pedidos activos."); return; }
        System.out.printf("%-5s %-12s %-15s %-15s %-22s %-10s%n",
                "ID", "Fecha", "Estado", "FormaPago", "Usuario", "Total");
        System.out.println("-".repeat(83));
        for (Pedido p : pedidos) {
            System.out.printf("%-5d %-12s %-15s %-15s %-22s $%.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(),
                    pedidoUsuario.getOrDefault(p.getId(), "(desconocido)"), p.getTotal());
        }
    }

    private static void pedidosPorUsuario() {
        List<Usuario> usuarios = usuarioRepo.listarActivos();
        if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos."); return; }
        imprimirUsuarios(usuarios);
        System.out.print("ID de usuario: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        List<Pedido> pedidos = pedidoRepo.buscarPorUsuario(id);
        if (pedidos.isEmpty()) { System.out.println("El usuario no tiene pedidos activos."); return; }
        for (Pedido p : pedidos) {
            System.out.printf("ID: %-5d | Fecha: %-12s | Estado: %-12s | FormaPago: %-15s | Total: $%.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), p.getTotal());
        }
    }

    private static void pedidosPorEstado() {
        System.out.println("Estado: 1-PENDIENTE  2-CONFIRMADO  3-TERMINADO  4-CANCELADO");
        System.out.print("Opción: ");
        EstadoPedido estado = seleccionarEstado(sc.nextLine().trim());
        if (estado == null) { System.out.println("Opción invalida."); return; }
        List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
        if (pedidos.isEmpty()) { System.out.println("No hay pedidos con estado " + estado + "."); return; }
        Map<Long, String> pedidoUsuario = buildPedidoUsuarioMap();
        for (Pedido p : pedidos) {
            System.out.printf("ID: %-5d | Fecha: %-12s | Usuario: %-22s | Total: $%.2f%n",
                    p.getId(), p.getFecha(),
                    pedidoUsuario.getOrDefault(p.getId(), "(desconocido)"), p.getTotal());
        }
    }

    // ── REPORTES ─────────────────────────────────────────────────────────────

    private static void menuReportes() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n----- Reportes -----");
            System.out.println("1. Productos por categoria");
            System.out.println("2. Pedidos por usuario");
            System.out.println("3. Pedidos por estado");
            System.out.println("4. Total facturado");
            System.out.println("0. Volver");
            System.out.print("Opcion: ");
            switch (sc.nextLine().trim()) {
                case "1": reporteProductosPorCategoria(); break;
                case "2": reportePedidosPorUsuario(); break;
                case "3": reportePedidosPorEstado(); break;
                case "4": reporteTotalFacturado(); break;
                case "0": volver = true; break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private static void reporteProductosPorCategoria() {
        List<Categoria> cats = categoriaRepo.listarActivos();
        if (cats.isEmpty()) { System.out.println("No hay categorias activas."); return; }
        imprimirCategorias(cats);
        System.out.print("ID de categoria: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        List<Producto> productos = productoRepo.buscarPorCategoria(id);
        if (productos.isEmpty()) {
            System.out.println("No hay productos activos en esa categoria.");
            return;
        }
        System.out.printf("%-5s %-25s %-10s %-6s%n", "ID", "Nombre", "Precio", "Stock");
        System.out.println("-".repeat(50));
        for (Producto p : productos) {
            System.out.printf("%-5d %-25s %-10.2f %-6d%n",
                    p.getId(), p.getNombre(), p.getPrecio(), p.getStock());
        }
    }

    private static void reportePedidosPorUsuario() {
        List<Usuario> usuarios = usuarioRepo.listarActivos();
        if (usuarios.isEmpty()) { System.out.println("No hay usuarios activos."); return; }
        imprimirUsuarios(usuarios);
        System.out.print("ID de usuario: ");
        Long id = parseLong(sc.nextLine().trim());
        if (id == null) { System.out.println("ID invalido."); return; }
        List<Pedido> pedidos = pedidoRepo.buscarPorUsuario(id);
        if (pedidos.isEmpty()) { System.out.println("El usuario no tiene pedidos activos."); return; }
        for (Pedido p : pedidos) {
            System.out.printf("ID: %-5d | Fecha: %-12s | Estado: %-12s | FormaPago: %-15s | Total: $%.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), p.getTotal());
        }
    }

    private static void reportePedidosPorEstado() {
        System.out.println("Estado: 1-PENDIENTE  2-CONFIRMADO  3-TERMINADO  4-CANCELADO");
        System.out.print("Opcion: ");
        EstadoPedido estado = seleccionarEstado(sc.nextLine().trim());
        if (estado == null) { System.out.println("Opcion invalida."); return; }

        Map<Long, String> pedidoUsuario = buildPedidoUsuarioMap();
        List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
        if (pedidos.isEmpty()) { System.out.println("No hay pedidos con estado " + estado + "."); return; }
        for (Pedido p : pedidos) {
            System.out.printf("ID: %-5d | Fecha: %-12s | Usuario: %-22s | Total: $%.2f%n",
                    p.getId(), p.getFecha(),
                    pedidoUsuario.getOrDefault(p.getId(), "(desconocido)"), p.getTotal());
        }
    }

    private static void reporteTotalFacturado() {
        List<Pedido> terminados = pedidoRepo.buscarPorEstado(EstadoPedido.TERMINADO);
        double total = terminados.stream()
                .mapToDouble(p -> p.getTotal() != null ? p.getTotal() : 0.0)
                .sum();
        System.out.println("Total facturado: " + String.format(Locale.US, "$%.2f", total));
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    /** Builds a reverse map pedidoId → "Nombre Apellido" by iterating all users and their orders. */
    private static Map<Long, String> buildPedidoUsuarioMap() {
        Map<Long, String> map = new HashMap<>();
        for (Usuario u : usuarioRepo.listarActivos()) {
            String nombreCompleto = u.getNombre() + " " + u.getApellido();
            for (Pedido p : pedidoRepo.buscarPorUsuario(u.getId())) {
                map.put(p.getId(), nombreCompleto);
            }
        }
        return map;
    }

    private static EstadoPedido seleccionarEstado(String opcion) {
        switch (opcion) {
            case "1": return EstadoPedido.PENDIENTE;
            case "2": return EstadoPedido.CONFIRMADO;
            case "3": return EstadoPedido.TERMINADO;
            case "4": return EstadoPedido.CANCELADO;
            default:  return null;
        }
    }

    private static void imprimirCategorias(List<Categoria> lista) {
        System.out.printf("%-5s %-30s %s%n", "ID", "Nombre", "Descripcion");
        System.out.println("-".repeat(70));
        for (Categoria c : lista) {
            System.out.printf("%-5d %-30s %s%n",
                    c.getId(), c.getNombre(),
                    c.getDescripcion() != null ? c.getDescripcion() : "");
        }
    }

    private static void imprimirUsuarios(List<Usuario> lista) {
        System.out.printf("%-5s %-30s %-30s %-10s%n", "ID", "Nombre completo", "Mail", "Rol");
        System.out.println("-".repeat(78));
        for (Usuario u : lista) {
            System.out.printf("%-5d %-30s %-30s %-10s%n",
                    u.getId(), u.getNombre() + " " + u.getApellido(), u.getMail(), u.getRol());
        }
    }

    private static void imprimirProductos(List<Producto> lista) {
        System.out.printf("%-5s %-25s %-10s %-6s %-13s%n", "ID", "Nombre", "Precio", "Stock", "Disponible");
        System.out.println("-".repeat(62));
        for (Producto p : lista) {
            System.out.printf("%-5d %-25s %-10.2f %-6d %-13s%n",
                    p.getId(), p.getNombre(), p.getPrecio(), p.getStock(),
                    Boolean.TRUE.equals(p.getDisponible()) ? "Disponible" : "No disp.");
        }
    }

    private static Long parseLong(String s) {
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
    }

    private static Integer parseInt(String s) {
        try { return Integer.parseInt(s); } catch (NumberFormatException e) { return null; }
    }

    private static Double parseDouble(String s) {
        try { return Double.parseDouble(s.replace(",", ".")); } catch (NumberFormatException e) { return null; }
    }
}
