// CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://txecerymvnfonhlsjiar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZWNlcnltdm5mb25obHNqaWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDg4NzYsImV4cCI6MjEwMTk4NDg3Nn0.VvFYibG2WxBgD5fM7J5zVhL7WnMghUy1EEglCyOAxA4";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// mascotas
const mascotasDiego = [
    { nombre: "Loki", ruta: "imagenes/Loki.png" }
];

const mascotasNatalia = [
    { nombre: "Maggie", ruta: "imagenes/Maggie.png" },
    { nombre: "Rita", ruta: "imagenes/Rita.png" },
    { nombre: "Mavi", ruta: "imagenes/Mavi.png" },
    { nombre: "Cani", ruta: "imagenes/Cani.png" }
];

const todasLasMascotas = [...mascotasNatalia, ...mascotasDiego];

// flores
const listaFlores = [
    "imagenes/Flower_1/Flower 1 - COLORFUL.png", "imagenes/Flower_1/Flower 1 - BLUE.png", "imagenes/Flower_1/Flower 1 - RED.png",
    "imagenes/Flower_1/Flower 1 - TEAL.png", "imagenes/Flower_1/Flower 1 - YELLOW.png", "imagenes/Flower_2/Flower 2 - MAGENTA.png",
    "imagenes/Flower_2/Flower 2 - PINK.png", "imagenes/Flower_2/Flower 2 - PURPLE.png", "imagenes/Flower_2/Flower 2 - TEAL.png",
    "imagenes/Flower_5/Flower 5 - BLUE.png", "imagenes/Flower_5/Flower 5 - ORANGE.png", "imagenes/Flower_5/Flower 5 - PINK.png",
    "imagenes/Flower_5/Flower 5 - PURPLE.png", "imagenes/Flower_6/Flower 6 - BLUE.png", "imagenes/Flower_6/Flower 6 - ORANGE.png",
    "imagenes/Flower_6/Flower 6 - PINK.png", "imagenes/Flower_6/Flower 6 - PINK 2.png", "imagenes/Flower_6/Flower 6 - PURPLE.png",
    "imagenes/Flower_7/Flower 7 - BLUE.png", "imagenes/Flower_7/Flower 7 - ORANGE.png", "imagenes/Flower_7/Flower 7 - PINK.png",
    "imagenes/Flower_7/Flower 7 - PINK 2.png", "imagenes/Flower_7/Flower 7 - PURPLE.png", "imagenes/Flower_8/Flower 8 - ORANGE.png",
    "imagenes/Flower_8/Flower 8 - PINK.png", "imagenes/Flower_8/Flower 8 - RED.png", "imagenes/Flower_8/Flower 8 - YELLOW.png",
    "imagenes/Flower_9/Flower 9 - ORANGE.png", "imagenes/Flower_9/Flower 9 - PURPLE.png", "imagenes/Flower_9/Flower 9 - RED.png",
    "imagenes/Flower_9/Flower 9 - YELLOW.png", "imagenes/Flower_13/Flower 13 - COLORFUL.png", "imagenes/Flower_13/Flower 13 - PINK.png",
    "imagenes/Flower_13/Flower 13 - PURPLE.png", "imagenes/Flower_13/Flower 13 - YELLOW.png"
];

const imagenSemilla = "imagenes/Semilla.png";

// vales
const catalogoValesAmor = [
    " Día de pedir pizza y ver películas juntos.",
    " Tarde de juegos de mesa o videojuegos juntos.",
    " Tarde de spa en casa",
    " Vale por un helado / postrecito",
    " Día de flojera: maratón de series en cama todo el día",
    " Picnic en un parque o jardín con mantita y comida rica.",
    " Tarde de escuchar música juntos",
    "Preparar juntos una receta de comida",

];


let estadoNivel = { nivel: 1, xp: 0 };
let listaRecompensas = [];
let metasJuntos = [];
let metasDiego = [];
let metasNatalia = [];

let metaIdEnEdicion = null;
let metaIdEnBorrado = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    actualizarInterfazNivel();
    renderizarTodasLasMetas();
    renderizarJardin();
    renderizarRecompensas();

    await cargarDatosDesdeSupabase();
    suscribirseACambiosEnTiempoReal();

    const btnGuardar = document.getElementById('btn-guardar-modal');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarEdicionModal);
});

function cambiarPestana(idPestana, botonSeleccionado) {
    document.querySelectorAll('.contenido-pestana').forEach(p => p.classList.remove('activa'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));

    const pestana = document.getElementById(idPestana);
    if (pestana) pestana.classList.add('activa');
    if (botonSeleccionado) botonSeleccionado.classList.add('activo');
}

// CARGAR DATOS DESDE SUPABASE
async function cargarDatosDesdeSupabase() {
    try {
        // 1. Cargar Nivel / XP (usa la tabla estado_jugadores: diego_hp = nivel, natalia_hp = xp)
        const { data: estado } = await _supabase.from('estado_jugadores').select('*').eq('id', 'partida_principal').maybeSingle();
        if (estado) {
            estadoNivel.nivel = estado.diego_hp || 1;
            estadoNivel.xp = estado.natalia_hp || 0;
            actualizarInterfazNivel();
        } else {
            await _supabase.from('estado_jugadores').insert([{ id: 'partida_principal', diego_hp: 1, natalia_hp: 0 }]);
        }

        // 2. Cargar Metas
        const { data: metas } = await _supabase.from('metas').select('*');
        if (metas) {
            metasJuntos = metas.filter(m => m.tipo === 'juntos');
            metasDiego = metas.filter(m => m.tipo === 'diego');
            metasNatalia = metas.filter(m => m.tipo === 'natalia');
        }

        // 3. Cargar Vales de Amor (Recompensas)
        const { data: recompensas } = await _supabase.from('recompensas').select('*');
        if (recompensas) {
            listaRecompensas = recompensas;
        }

        renderizarTodasLasMetas();
        renderizarJardin();
        renderizarRecompensas();
    } catch (e) {
        console.error("Error al conectar con Supabase:", e);
    }
}

// TIEMPO REAL
function suscribirseACambiosEnTiempoReal() {
    _supabase.channel('cambios-juego')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_jugadores' }, payload => {
            if (payload.new) {
                estadoNivel.nivel = payload.new.diego_hp || 1;
                estadoNivel.xp = payload.new.natalia_hp || 0;
                actualizarInterfazNivel();
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'metas' }, async () => {
            const { data: metas } = await _supabase.from('metas').select('*');
            if (metas) {
                metasJuntos = metas.filter(m => m.tipo === 'juntos');
                metasDiego = metas.filter(m => m.tipo === 'diego');
                metasNatalia = metas.filter(m => m.tipo === 'natalia');
                renderizarTodasLasMetas();
                renderizarJardin();
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recompensas' }, async () => {
            const { data: recompensas } = await _supabase.from('recompensas').select('*');
            if (recompensas) {
                listaRecompensas = recompensas;
                renderizarRecompensas();
            }
        })
        .subscribe();
}

// logica de nivel
function actualizarInterfazNivel() {
    const textoNivel = document.getElementById('texto-nivel');
    const xpTexto = document.getElementById('xp-texto');
    const xpFill = document.getElementById('xp-fill-barra');
    const fraseRacha = document.getElementById('frase-racha');

    if (!textoNivel || !xpTexto || !xpFill) return;

    textoNivel.innerText = `Nivel ${estadoNivel.nivel}`;
    xpTexto.innerText = `${estadoNivel.xp} / 100 XP`;
    xpFill.style.width = `${Math.min(100, estadoNivel.xp)}%`;

    if (fraseRacha) {
        if (estadoNivel.nivel === 1) fraseRacha.innerText = "¡Comiencen a cumplir metas para subir de nivel!";
        else if (estadoNivel.nivel < 5) fraseRacha.innerText = "🌸 ¡Construyendo recuerdos juntos!";
        else fraseRacha.innerText = "✨ ¡Pareja legendaria imparable!";
    }
}

async function agregarXP(puntos) {
    let nuevoXP = estadoNivel.xp + puntos;
    let nuevoNivel = estadoNivel.nivel;

    if (nuevoXP >= 100) {
        nuevoNivel += Math.floor(nuevoXP / 100);
        nuevoXP = nuevoXP % 100;
        
        lanzarLluviaChispas();

        // desbloqueo de cofre al subir de nivel
        const valeAzar = catalogoValesAmor[Math.floor(Math.random() * catalogoValesAmor.length)];
        await desbloquearValeAmor(valeAzar);

        const tituloModal = document.getElementById('titulo-modal-cumplir');
        const textoRecompensa = document.getElementById('texto-recompensa-desbloqueada');
        
        if (tituloModal) tituloModal.innerText = `¡SUBIERON A NIVEL ${nuevoNivel}! 🎉✨`;
        if (textoRecompensa) textoRecompensa.innerText = `Desbloquearon: "${valeAzar}"`;
        
        const modalCumplir = document.getElementById('modal-cumplir-meta');
        if (modalCumplir) modalCumplir.classList.add('activo');
    }

    estadoNivel.nivel = nuevoNivel;
    estadoNivel.xp = nuevoXP;
    actualizarInterfazNivel();

    await _supabase.from('estado_jugadores').update({
        diego_hp: estadoNivel.nivel,
        natalia_hp: estadoNivel.xp
    }).eq('id', 'partida_principal');
}

// Metas
async function agregarMetaJuntos() {
    const input = document.getElementById('nueva-meta-input');
    if (!input) return;
    const texto = input.value.trim();
    if (texto === '') return;

    const nuevaMeta = {
        id: Date.now(),
        texto: texto,
        tipo: 'juntos',
        completada: false,
        fecha_cumplida: null,
        flor_index: null
    };

    input.value = '';
    await _supabase.from('metas').insert([nuevaMeta]);
}

async function agregarMetaIndividual(dueno) {
    const input = document.getElementById(`input-meta-${dueno}`);
    if (!input) return;
    const texto = input.value.trim();
    if (texto === '') return;

    const nuevaMeta = {
        id: Date.now(),
        texto: texto,
        tipo: dueno,
        completada: false,
        fecha_cumplida: null,
        flor_index: null
    };

    input.value = '';
    await _supabase.from('metas').insert([nuevaMeta]);
}

// LÓGICA DE NIVEL Y XP (AQUÍ SE DESBLOQUEA EL COFRE AL SUBIR DE NIVEL)
async function agregarXP(puntos) {
    let nuevoXP = estadoNivel.xp + puntos;
    let nuevoNivel = estadoNivel.nivel;

    // Solo si alcanza o supera los 100 XP se sube de nivel y se gana el vale
    if (nuevoXP >= 100) {
        nuevoNivel += Math.floor(nuevoXP / 100);
        nuevoXP = nuevoXP % 100;
        
        lanzarLluviaChispas();

        // 🎁 DESBLOQUEAR COFRE DE VALE DE AMOR AL SUBIR DE NIVEL
        const valeAzar = catalogoValesAmor[Math.floor(Math.random() * catalogoValesAmor.length)];
        await desbloquearValeAmor(valeAzar);

        const tituloModal = document.getElementById('titulo-modal-cumplir');
        const textoRecompensa = document.getElementById('texto-recompensa-desbloqueada');
        
        if (tituloModal) tituloModal.innerText = `¡SUBIERON A NIVEL ${nuevoNivel}! 🎉✨`;
        if (textoRecompensa) textoRecompensa.innerText = `Desbloquearon: "${valeAzar}"`;
        
        const modalCumplir = document.getElementById('modal-cumplir-meta');
        if (modalCumplir) modalCumplir.classList.add('activo');
    }

    estadoNivel.nivel = nuevoNivel;
    estadoNivel.xp = nuevoXP;
    actualizarInterfazNivel();

    await _supabase.from('estado_jugadores').update({
        diego_hp: estadoNivel.nivel,
        natalia_hp: estadoNivel.xp
    }).eq('id', 'partida_principal');
}

async function toggleMeta(tipo, id, event) {
    let lista = obtenerListaPorTipo(tipo);
    const meta = lista.find(m => m.id === id);
    if (!meta) return;

    const estadoNuevo = !meta.completada;
    const fecha = estadoNuevo ? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const flor = estadoNuevo ? Math.floor(Math.random() * listaFlores.length) : null;

    if (estadoNuevo) {
        lanzarChispasEnEsquinas(id);

        if (tipo === 'juntos') {
            await agregarXP(25);
        } else {
            await agregarXP(15);
        }
    }

    await _supabase.from('metas').update({
        completada: estadoNuevo,
        fecha_cumplida: fecha,
        flor_index: flor
    }).eq('id', id);
}

function cerrarModalCumplir() {
    const modalCumplir = document.getElementById('modal-cumplir-meta');
    if (modalCumplir) modalCumplir.classList.remove('activo');
}

// vales de amor
async function desbloquearValeAmor(textoVale) {
    const nuevoVale = {
        id: Date.now(),
        ganador: 'juntos',
        perdedor: 'juntos',
        texto: textoVale,
        cumplida: false,
        fecha_cumplida: null
    };

    await _supabase.from('recompensas').insert([nuevoVale]);
}

async function marcarRecompensaCumplida(id) {
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    await _supabase.from('recompensas').update({
        cumplida: true,
        fecha_cumplida: fecha
    }).eq('id', id);
}

// borrar metas
function abrirModalBorrar(tipo, id) {
    metaIdEnBorrado = id;
    const modalBorrar = document.getElementById('modal-borrar');
    if (modalBorrar) modalBorrar.classList.add('activo');
}

function cerrarModalBorrar() {
    const modalBorrar = document.getElementById('modal-borrar');
    if (modalBorrar) modalBorrar.classList.remove('activo');
    metaIdEnBorrado = null;
}

async function ejecutarBorradoFinal() {
    if (metaIdEnBorrado !== null) {
        const idParaBorrar = metaIdEnBorrado;
        cerrarModalBorrar();
        await _supabase.from('metas').delete().eq('id', idParaBorrar);
    }
}

// RENDERIZADO DE INTERFAZ
function renderizarTodasLasMetas() {
    renderizarLista('lista-metas-juntos', metasJuntos, 'juntos', todasLasMascotas);
    renderizarLista('lista-metas-diego', metasDiego, 'diego', mascotasDiego);
    renderizarLista('lista-metas-natalia', metasNatalia, 'natalia', mascotasNatalia);
}

function renderizarLista(idContenedor, lista, tipo, mascotasValidas) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    lista.forEach((meta, index) => {
        const renglon = document.createElement('div');
        renglon.classList.add('renglon-meta');
        const mascotaActual = mascotasValidas[index % mascotasValidas.length];

        renglon.innerHTML = `
            <div class="mascota-libre-marco" title="${mascotaActual.nombre}">
                <img src="${mascotaActual.ruta}" onError="this.src='https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f436.png'" alt="${mascotaActual.nombre}" class="sprite-mascota-libre">
                <span class="zzz-animada">💤</span>
            </div>
            <div class="contenido-meta" id="card-meta-${meta.id}">
                <div class="meta-check-texto">
                    <input type="checkbox" id="meta-${meta.id}" ${meta.completada ? 'checked' : ''} onchange="toggleMeta('${tipo}', ${meta.id}, event)">
                    <label for="meta-${meta.id}" class="${meta.completada ? 'texto-tachado-verde' : ''}">${meta.texto}</label>
                </div>
                <div class="acciones-meta">
                    <button class="btn-accion btn-editar" onclick="abrirModalEditar('${tipo}', ${meta.id})" title="Editar">✎</button>
                    <button class="btn-accion btn-borrar" onclick="abrirModalBorrar('${tipo}', ${meta.id})" title="Borrar">🗑</button>
                </div>
            </div>
        `;
        contenedor.appendChild(renglon);
    });

    if (tipo === 'juntos') {
        const renglonAgregar = document.createElement('div');
        renglonAgregar.classList.add('renglon-meta', 'renglon-agregar');
        renglonAgregar.innerHTML = `
            <div class="contenido-meta">
                <input type="text" id="nueva-meta-input" placeholder="Escribe una nueva meta para los dos...">
                <button id="btn-agregar" onclick="agregarMetaJuntos()">+ Añadir Meta</button>
            </div>
        `;
        contenedor.appendChild(renglonAgregar);
    }
}

function renderizarJardin() {
    const gridJardin = document.getElementById('grid-jardin');
    if (!gridJardin) return;

    const todasLasMetas = [...metasJuntos, ...metasDiego, ...metasNatalia];

    if (todasLasMetas.length === 0) {
        gridJardin.innerHTML = `<div class="tierra-vacia"><p>🌱 Agreguen su primera meta para plantar una semilla.</p></div>`;
        return;
    }

    gridJardin.innerHTML = '';

    todasLasMetas.forEach(meta => {
        const card = document.createElement('div');
        const claseColorOrigen = meta.tipo === 'diego' ? 'flor-diego' : (meta.tipo === 'natalia' ? 'flor-natalia' : 'flor-juntos');
        const textoOrigen = meta.tipo === 'diego' ? 'Diego' : (meta.tipo === 'natalia' ? 'Natalia' : 'Juntos');

        if (meta.completada) {
            card.classList.add('card-planta', 'animacion-florecer', claseColorOrigen);
            const idx = meta.flor_index !== null ? meta.flor_index : 0;
            const rutaFlor = listaFlores[idx % listaFlores.length];

            card.innerHTML = `
                <img src="${rutaFlor}" onError="this.src='https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f338.png'" alt="Flor" class="sprite-pixel" style="width: 52px; height: 52px;">
                <p style="font-size: 0.85rem; font-weight: bold; color: #ff1493; margin-top: 8px;">${meta.texto}</p>
                <span class="badge-origen-meta">${textoOrigen}</span>
                <p style="font-size: 0.7rem; color: #2a9d8f; font-weight: bold; margin-top: 4px;">🌸 ${meta.fecha_cumplida}</p>
            `;
        } else {
            card.classList.add('card-planta', 'card-semilla', claseColorOrigen);
            card.innerHTML = `
                <img src="${imagenSemilla}" onError="this.src='https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f331.png'" alt="Semilla" class="sprite-pixel" style="width: 40px; height: 40px;">
                <p style="font-size: 0.8rem; color: #8d6e63; margin-top: 8px;">${meta.texto}</p>
                <span class="badge-origen-meta">${textoOrigen}</span>
                <p style="font-size: 0.65rem; color: #a1887f; margin-top: 4px;">🌱 En crecimiento...</p>
            `;
        }
        gridJardin.appendChild(card);
    });
}

function renderizarRecompensas() {
    const grid = document.getElementById('grid-recompensas');
    if (!grid) return;

    if (listaRecompensas.length === 0) {
        grid.innerHTML = `<p style="color: #ff1493; font-weight: bold;">🎟️ Aún no hay vales desbloqueados.</p>`;
        return;
    }

    grid.innerHTML = '';

    listaRecompensas.forEach(rec => {
        const card = document.createElement('div');
        card.classList.add('card-recompensa');
        if (rec.cumplida) card.classList.add('cumplida');

        card.innerHTML = `
            <div>
                <span style="font-size: 1.8rem;">🎟️</span>
                <p style="font-size: 0.85rem; font-weight: bold; color: #ff1493; margin-top: 6px;">${rec.texto}</p>
            </div>
            ${rec.cumplida ? 
                `<p style="font-size: 0.75rem; color: #2a9d8f; font-weight: bold; margin-top: 8px;">💖 Disfrutado el ${rec.fecha_cumplida}</p>` :
                `<button class="btn-cumplir-recompensa" onclick="marcarRecompensaCumplida(${rec.id})">✓ Canjear Vale</button>`
            }
        `;

        grid.appendChild(card);
    });
}

function abrirModalEditar(tipo, id) {
    metaIdEnEdicion = id;
    const lista = obtenerListaPorTipo(tipo);
    const meta = lista.find(m => m.id === id);
    if (!meta) return;

    const inputModal = document.getElementById('input-editar-meta');
    inputModal.value = meta.texto;
    document.getElementById('modal-editar').classList.add('activo');
    inputModal.focus();
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').classList.remove('activo');
    metaIdEnEdicion = null;
}

async function guardarEdicionModal() {
    const inputModal = document.getElementById('input-editar-meta');
    const nuevoTexto = inputModal.value.trim();

    if (nuevoTexto !== '' && metaIdEnEdicion !== null) {
        const idEditar = metaIdEnEdicion;
        cerrarModalEditar();
        await _supabase.from('metas').update({ texto: nuevoTexto }).eq('id', idEditar);
    }
}

function obtenerListaPorTipo(tipo) {
    if (tipo === 'juntos') return metasJuntos;
    if (tipo === 'diego') return metasDiego;
    if (tipo === 'natalia') return metasNatalia;
    return [];
}

// efecto de chispas
function lanzarChispasEnEsquinas(id) {
    const tarjeta = document.getElementById(`card-meta-${id}`);
    if (!tarjeta) return;
    const rect = tarjeta.getBoundingClientRect();
    crearBroteChispas(rect.left + 10, rect.top + 5);
    crearBroteChispas(rect.right - 10, rect.top + 5);
}

function lanzarLluviaChispas() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const randomX = window.innerWidth * Math.random();
            const randomY = window.innerHeight * 0.3;
            crearBroteChispas(randomX, randomY);
        }, i * 150);
    }
}

function crearBroteChispas(origenX, origenY) {
    const contenedor = document.getElementById('contenedor-chispas');
    if (!contenedor) return;
    const colores = ['#ff1493', '#ff69b4', '#2a9d8f', '#ffd166', '#ffffff'];

    for (let i = 0; i < 14; i++) {
        const chispa = document.createElement('div');
        chispa.classList.add('chispa-pixel');
        chispa.style.left = `${origenX}px`;
        chispa.style.top = `${origenY}px`;
        chispa.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
        chispa.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
        chispa.style.setProperty('--dy', `${(Math.random() * -80) - 20}px`);

        contenedor.appendChild(chispa);
        setTimeout(() => chispa.remove(), 600);
    }
}
