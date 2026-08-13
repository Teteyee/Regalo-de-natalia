// CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://txecerymvnfonhlsjiar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhYmdjaW9iIJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZWNlcnltdm5mb25obHNqaWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0NDg3Nn0.VvFYibG2WxBgD5fM7J5zVhL7WnMghUy1EEglCyOAxA4";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CLASIFICACIÓN Y ORDEN DE MASCOTAS
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

// FLORES Y SEMILLA
const listaFlores = [
    "Flower_1/Flower 1 - COLORFUL.png", "Flower_1/Flower 1 - BLUE.png", "Flower_1/Flower 1 - RED.png",
    "Flower_1/Flower 1 - TEAL.png", "Flower_1/Flower 1 - YELLOW.png", "Flower_2/Flower 2 - MAGENTA.png",
    "Flower_2/Flower 2 - PINK.png", "Flower_2/Flower 2 - PURPLE.png", "Flower_2/Flower 2 - TEAL.png",
    "Flower_5/Flower 5 - BLUE.png", "Flower_5/Flower 5 - ORANGE.png", "Flower_5/Flower 5 - PINK.png",
    "Flower_5/Flower 5 - PURPLE.png", "Flower_6/Flower 6 - BLUE.png", "Flower_6/Flower 6 - ORANGE.png",
    "Flower_6/Flower 6 - PINK.png", "Flower_6/Flower 6 - PINK 2.png", "Flower_6/Flower 6 - PURPLE.png",
    "Flower_7/Flower 7 - BLUE.png", "Flower_7/Flower 7 - ORANGE.png", "Flower_7/Flower 7 - PINK.png",
    "Flower_7/Flower 7 - PINK 2.png", "Flower_7/Flower 7 - PURPLE.png", "Flower_8/Flower 8 - ORANGE.png",
    "Flower_8/Flower 8 - PINK.png", "Flower_8/Flower 8 - RED.png", "Flower_8/Flower 8 - YELLOW.png",
    "Flower_9/Flower 9 - ORANGE.png", "Flower_9/Flower 9 - PURPLE.png", "Flower_9/Flower 9 - RED.png",
    "Flower_9/Flower 9 - YELLOW.png", "Flower_13/Flower 13 - COLORFUL.png", "Flower_13/Flower 13 - PINK.png",
    "Flower_13/Flower 13 - PURPLE.png", "Flower_13/Flower 13 - YELLOW.png"
];

const imagenSemilla = "imagenes/Semilla.png";

// VARIABLES DE ESTADO EN MEMORIA
let hpData = { diego: 100, natalia: 100 };
let listaRecompensas = [];
let metasJuntos = [];
let metasDiego = [];
let metasNatalia = [];

let metaIdEnEdicion = null;
let metaIdEnBorrado = null;
let tipoMetaEnBorrado = null;
let metaIdCumpliendo = null;
let tipoMetaCumpliendo = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    // Dibujar interfaz inmediatamente
    actualizarBarrasHP();
    renderizarTodasLasMetas();
    renderizarJardin();
    renderizarRecompensas();

    // Cargar datos reales y escuchar cambios
    await cargarDatosDesdeSupabase();
    suscribirseACambiosEnTiempoReal();

    document.getElementById('btn-guardar-modal').addEventListener('click', guardarEdicionModal);
});

function cambiarPestana(idPestana, botonSeleccionado) {
    document.querySelectorAll('.contenido-pestana').forEach(p => p.classList.remove('activa'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));

    const pestana = document.getElementById(idPestana);
    if (pestana) pestana.classList.add('activa');
    if (botonSeleccionado) botonSeleccionado.classList.add('activo');
}

// CARGAR DATOS
async function cargarDatosDesdeSupabase() {
    try {
        // 1. Cargar HP
        const { data: estado } = await _supabase.from('estado_jugadores').select('*').eq('id', 'partida_principal').maybeSingle();
        if (estado) {
            hpData.diego = estado.diego_hp;
            hpData.natalia = estado.natalia_hp;
            actualizarBarrasHP();
        } else {
            // Si la fila no existe, crearla
            await _supabase.from('estado_jugadores').insert([{ id: 'partida_principal', diego_hp: 100, natalia_hp: 100 }]);
        }

        // 2. Cargar Metas
        const { data: metas } = await _supabase.from('metas').select('*');
        if (metas) {
            metasJuntos = metas.filter(m => m.tipo === 'juntos');
            metasDiego = metas.filter(m => m.tipo === 'diego');
            metasNatalia = metas.filter(m => m.tipo === 'natalia');
        }

        // 3. Cargar Recompensas
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
                hpData.diego = payload.new.diego_hp;
                hpData.natalia = payload.new.natalia_hp;
                actualizarBarrasHP();
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

// BARRAS DE VIDA (HP)
function actualizarBarrasHP() {
    const fillDiego = document.getElementById('hp-fill-diego');
    const textoDiego = document.getElementById('hp-texto-diego');
    const imgDiego = document.getElementById('avatar-diego');
    const badgeDiego = document.getElementById('badge-diego');

    const fillNatalia = document.getElementById('hp-fill-natalia');
    const textoNatalia = document.getElementById('hp-texto-natalia');
    const imgNatalia = document.getElementById('avatar-natalia');
    const badgeNatalia = document.getElementById('badge-natalia');

    if (!fillDiego || !fillNatalia) return;

    fillDiego.style.width = `${hpData.diego}%`;
    textoDiego.innerText = `${hpData.diego}/100 HP`;
    if (hpData.diego <= 40) {
        fillDiego.classList.add('hp-bajo');
        badgeDiego.innerText = '🩹';
        imgDiego.src = 'imagenes/Diegodañado.png';
    } else {
        fillDiego.classList.remove('hp-bajo');
        badgeDiego.innerText = '';
        imgDiego.src = 'imagenes/Diego.png';
    }

    fillNatalia.style.width = `${hpData.natalia}%`;
    textoNatalia.innerText = `${hpData.natalia}/100 HP`;
    if (hpData.natalia <= 40) {
        fillNatalia.classList.add('hp-bajo');
        badgeNatalia.innerText = '🩹';
        imgNatalia.src = 'imagenes/Nataliadañada.png';
    } else {
        fillNatalia.classList.remove('hp-bajo');
        badgeNatalia.innerText = '';
        imgNatalia.src = 'imagenes/Natalia.png';
    }
}

async function guardarHPEnSupabase() {
    await _supabase.from('estado_jugadores').update({
        diego_hp: hpData.diego,
        natalia_hp: hpData.natalia
    }).eq('id', 'partida_principal');
}

async function sumarHP(persona, puntos) {
    if (persona === 'diego') hpData.diego = Math.min(100, hpData.diego + puntos);
    if (persona === 'natalia') hpData.natalia = Math.min(100, hpData.natalia + puntos);
    actualizarBarrasHP();
    await guardarHPEnSupabase();
}

async function reducirHP(persona, puntos) {
    if (persona === 'diego') {
        hpData.diego = Math.max(0, hpData.diego - puntos);
        if (hpData.diego === 0) abrirModalCanje('diego');
    } else if (persona === 'natalia') {
        hpData.natalia = Math.max(0, hpData.natalia - puntos);
        if (hpData.natalia === 0) abrirModalCanje('natalia');
    }
    actualizarBarrasHP();
    await guardarHPEnSupabase();
}

// METAS
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

async function toggleMeta(tipo, id, event) {
    let lista = obtenerListaPorTipo(tipo);
    const meta = lista.find(m => m.id === id);
    if (!meta) return;

    const estadoNuevo = !meta.completada;
    const fecha = estadoNuevo ? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const flor = estadoNuevo ? Math.floor(Math.random() * listaFlores.length) : null;

    if (estadoNuevo) {
        lanzarChispasEnEsquinas(id);
        
        // Si es meta JUNTOS, abrir el modal de encuesta para otorgar los puntos
        if (tipo === 'juntos') {
            metaIdCumpliendo = id;
            tipoMetaCumpliendo = tipo;
            document.getElementById('modal-cumplir-meta').classList.add('activo');
        }
    }

    await _supabase.from('metas').update({
        completada: estadoNuevo,
        fecha_cumplida: fecha,
        flor_index: flor
    }).eq('id', id);
}

function procesarPuntosCumplimiento(quien) {
    if (quien === 'ambos') {
        sumarHP('diego', 20);
        sumarHP('natalia', 20);
    } else if (quien === 'diego') {
        sumarHP('diego', 20);
    } else if (quien === 'natalia') {
        sumarHP('natalia', 20);
    }

    document.getElementById('modal-cumplir-meta').classList.remove('activo');
    metaIdCumpliendo = null;
    tipoMetaCumpliendo = null;
}

function abrirModalBorrar(tipo, id) {
    tipoMetaEnBorrado = tipo;
    metaIdEnBorrado = id;

    document.getElementById('borrar-paso-1').style.display = 'none';
    document.getElementById('borrar-paso-2').style.display = 'none';
    document.getElementById('borrar-individual').style.display = 'none';

    if (tipo === 'diego' || tipo === 'natalia') {
        document.getElementById('borrar-individual').style.display = 'block';
    } else {
        document.getElementById('borrar-paso-1').style.display = 'block';
    }

    document.getElementById('modal-borrar').classList.add('activo');
}

function procesarBorradoPaso1(opcion) {
    if (opcion === 'equivocacion') {
        ejecutarBorradoFinal();
    } else if (opcion === 'no_cumplira') {
        document.getElementById('borrar-paso-1').style.display = 'none';
        document.getElementById('borrar-paso-2').style.display = 'block';
    }
}

function finalizarBorradoConRazon(razon) {
    if (razon === 'Diego tuvo la culpa') reducirHP('diego', 20);
    if (razon === 'Natalia tuvo la culpa') reducirHP('natalia', 20);
    ejecutarBorradoFinal();
}

async function ejecutarBorradoFinal() {
    if (metaIdEnBorrado !== null) {
        const idParaBorrar = metaIdEnBorrado;
        cerrarModalBorrar();
        await _supabase.from('metas').delete().eq('id', idParaBorrar);
    }
}

function cerrarModalBorrar() {
    document.getElementById('modal-borrar').classList.remove('activo');
    metaIdEnBorrado = null;
    tipoMetaEnBorrado = null;
}

// RECOMPENSAS
function abrirModalCanje(quienMurio) {
    const modal = document.getElementById('modal-recompensa-muerte');
    const titulo = document.getElementById('titulo-modal-muerte');
    const contenedor = document.getElementById('contenedor-opciones-recompensa');

    contenedor.innerHTML = '';

    if (quienMurio === 'diego') {
        titulo.innerText = "¡DIEGO LLEGÓ A 0 HP! 💀";
        const opcionesNatalia = [
            "Salir a comer juntos a donde Natalia diga",
            "Comprarle algo a Natalia",
            "Invitarlo a su casa y hacer TODO lo que ella diga"
        ];
        opcionesNatalia.forEach(opcion => {
            const btn = document.createElement('button');
            btn.classList.add('btn-opcion-modal');
            btn.innerText = opcion;
            btn.onclick = () => registrarRecompensaYRestaurar('natalia', 'diego', opcion);
            contenedor.appendChild(btn);
        });
    } else {
        titulo.innerText = "¡NATALIA LLEGÓ A 0 HP! 💀";
        const opcionesDiego = [
            "Invitarla a mi casa y hacer TODO lo que yo diga",
            "Cocinarme algún postre"
        ];
        opcionesDiego.forEach(opcion => {
            const btn = document.createElement('button');
            btn.classList.add('btn-opcion-modal');
            btn.innerText = opcion;
            btn.onclick = () => registrarRecompensaYRestaurar('diego', 'natalia', opcion);
            contenedor.appendChild(btn);
        });
    }

    modal.classList.add('activo');
}

async function registrarRecompensaYRestaurar(ganador, perdedor, textoOpcion) {
    if (perdedor === 'diego') hpData.diego = 100;
    if (perdedor === 'natalia') hpData.natalia = 100;

    actualizarBarrasHP();
    await guardarHPEnSupabase();

    const nuevaRecompensa = {
        id: Date.now(),
        ganador: ganador,
        perdedor: perdedor,
        texto: textoOpcion,
        cumplida: false,
        fecha_cumplida: null
    };

    await _supabase.from('recompensas').insert([nuevaRecompensa]);
    document.getElementById('modal-recompensa-muerte').classList.remove('activo');
}

async function marcarRecompensaCumplida(id) {
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    await _supabase.from('recompensas').update({
        cumplida: true,
        fecha_cumplida: fecha
    }).eq('id', id);
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
        gridJardin.innerHTML = `<div class="tierra-vacia"><p>🌱 Agrega tu primera meta para plantar una semilla.</p></div>`;
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
        grid.innerHTML = `<p style="color: #bc6c25;">📜 No hay recompensas pendientes.</p>`;
        return;
    }

    grid.innerHTML = '';

    listaRecompensas.forEach(rec => {
        const card = document.createElement('div');
        card.classList.add('card-recompensa');
        if (rec.cumplida) card.classList.add('cumplida');

        const acreedor = rec.ganador === 'natalia' ? 'Natalia' : 'Diego';
        const deudor = rec.perdedor === 'diego' ? 'Diego' : 'Natalia';

        card.innerHTML = `
            <div>
                <span style="font-size: 1.8rem;">📜</span>
                <p style="font-size: 0.85rem; font-weight: bold; color: #bc6c25; margin-top: 6px;">${rec.texto}</p>
                <p style="font-size: 0.7rem; color: #666; margin-top: 4px;">Paga: <b>${deudor}</b> | Para: <b>${acreedor}</b></p>
            </div>
            ${rec.cumplida ? 
                `<p style="font-size: 0.75rem; color: #2a9d8f; font-weight: bold; margin-top: 8px;">✅ Cumplido el ${rec.fecha_cumplida}</p>` :
                `<button class="btn-cumplir-recompensa" onclick="marcarRecompensaCumplida(${rec.id})">✓ Marcar Pagada</button>`
            }
        `;

        grid.appendChild(card);
    });
}

function abrirModalEditar(tipo, id) {
    tipoMetaEnBorrado = tipo;
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

function lanzarChispasEnEsquinas(id) {
    const tarjeta = document.getElementById(`card-meta-${id}`);
    if (!tarjeta) return;
    const rect = tarjeta.getBoundingClientRect();
    crearBroteChispas(rect.left + 10, rect.top + 5);
    crearBroteChispas(rect.right - 10, rect.top + 5);
}

function crearBroteChispas(origenX, origenY) {
    const contenedor = document.getElementById('contenedor-chispas');
    const colores = ['#ff1493', '#ff69b4', '#2a9d8f', '#ffd166', '#ffffff'];

    for (let i = 0; i < 12; i++) {
        const chispa = document.createElement('div');
        chispa.classList.add('chispa-pixel');
        chispa.style.left = `${origenX}px`;
        chispa.style.top = `${origenY}px`;
        chispa.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
        chispa.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
        chispa.style.setProperty('--dy', `${(Math.random() * -60) - 20}px`);

        contenedor.appendChild(chispa);
        setTimeout(() => chispa.remove(), 600);
    }
}
