// Datos geográficos para el seed. Foco: mercado latinoamericano y europeo
// hispanohablante. Cada país incluye sus principales ciudades. El slug se
// deriva del nombre con slugify() en el seed, así que aquí basta el nombre.
//
// Es additivo: el seed hace upsert por (code) y (countryId, slug); no borra
// ciudades existentes que no aparezcan aquí.

export type SeedCountry = {
  code: string;
  name: string;
  locale: string;
  cities: string[];
};

export const COUNTRIES: SeedCountry[] = [
  {
    code: "es",
    name: "España",
    locale: "es",
    cities: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma de Mallorca", "Las Palmas de Gran Canaria", "Bilbao",
      "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "L'Hospitalet de Llobregat",
      "A Coruña", "Granada", "Vitoria-Gasteiz", "Elche", "Santa Cruz de Tenerife",
      "Oviedo", "Badalona", "Cartagena", "Terrassa", "Jerez de la Frontera",
      "Sabadell", "Móstoles", "Alcalá de Henares", "Pamplona", "Fuenlabrada",
      "Almería", "Leganés", "San Sebastián", "Santander", "Castellón de la Plana",
      "Burgos", "Albacete", "Getafe", "Salamanca", "Logroño", "Huelva",
      "Marbella", "Lleida", "Tarragona", "León", "Cádiz", "Jaén", "Ourense",
      "Girona", "Lugo", "Cáceres", "Toledo", "Ceuta", "Melilla", "Ibiza",
    ],
  },
  {
    code: "mx",
    name: "México",
    locale: "es",
    cities: [
      "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
      "León", "Ciudad Juárez", "Zapopan", "Mérida", "San Luis Potosí",
      "Aguascalientes", "Querétaro", "Mexicali", "Acapulco", "Cancún",
      "Culiacán", "Hermosillo", "Saltillo", "Morelia", "Chihuahua",
      "Toluca", "Torreón", "Tampico", "Veracruz", "Villahermosa",
      "Oaxaca", "Tuxtla Gutiérrez", "Cuernavaca", "Durango", "Reynosa",
      "Matamoros", "Tepic", "Nuevo Laredo", "Mazatlán", "Ensenada",
      "Pachuca", "Tlaxcala", "Campeche", "Chetumal", "La Paz",
      "Colima", "Zacatecas", "Tapachula", "Ciudad Obregón", "Playa del Carmen",
      "Puerto Vallarta", "Coatzacoalcos", "Irapuato", "Celaya", "Tepatitlán",
    ],
  },
  {
    code: "ar",
    name: "Argentina",
    locale: "es",
    cities: [
      "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata",
      "San Miguel de Tucumán", "Mar del Plata", "Salta", "Santa Fe",
      "San Juan", "Resistencia", "Neuquén", "Santiago del Estero",
      "Corrientes", "Posadas", "Bahía Blanca", "Paraná", "Formosa",
      "San Salvador de Jujuy", "La Rioja", "Río Cuarto", "Comodoro Rivadavia",
      "San Luis", "Catamarca", "Concordia", "San Rafael", "Tandil",
      "San Fernando del Valle de Catamarca", "Rawson", "Ushuaia",
      "Río Gallegos", "Viedma", "Santa Rosa", "San Carlos de Bariloche",
      "Villa Carlos Paz", "Pergamino", "Quilmes", "Avellaneda", "Lanús",
    ],
  },
  {
    code: "co",
    name: "Colombia",
    locale: "es",
    cities: [
      "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
      "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
      "Manizales", "Villavicencio", "Neiva", "Pasto", "Montería",
      "Armenia", "Valledupar", "Sincelejo", "Popayán", "Palmira",
      "Buenaventura", "Floridablanca", "Tunja", "Soledad", "Bello",
      "Soacha", "Riohacha", "Quibdó", "Florencia", "Yopal",
      "Tuluá", "Girardot", "Barrancabermeja", "Cartago", "Dosquebradas",
      "Maicao", "Magangué", "Fusagasugá", "San Andrés", "Leticia",
    ],
  },
  {
    code: "ve",
    name: "Venezuela",
    locale: "es",
    cities: [
      "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay",
      "Ciudad Guayana", "Maturín", "Barcelona", "Cumaná", "Mérida",
      "Barinas", "San Cristóbal", "Ciudad Bolívar", "Cabimas", "Los Teques",
      "Punto Fijo", "Guarenas", "Acarigua", "Puerto La Cruz", "Petare",
      "Guacara", "Coro", "Carúpano", "El Tigre", "Valera", "Guanare",
      "Puerto Cabello", "Turmero", "La Victoria", "Cúa", "Charallave",
      "Porlamar", "Tucupita", "San Fernando de Apure", "San Felipe",
      "Trujillo", "San Juan de los Morros", "La Guaira", "Carora", "Ocumare del Tuy",
    ],
  },
  {
    code: "cl",
    name: "Chile",
    locale: "es",
    cities: [
      "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta",
      "Temuco", "Rancagua", "Talca", "Arica", "Chillán",
      "Iquique", "Los Ángeles", "Puerto Montt", "Coquimbo", "Osorno",
      "Valdivia", "Punta Arenas", "Copiapó", "Curicó", "Quillota",
      "Calama", "Viña del Mar", "San Antonio", "Linares", "Ovalle",
      "Coyhaique", "Castro", "Melipilla", "Talcahuano", "Quilpué",
    ],
  },
  {
    code: "pe",
    name: "Perú",
    locale: "es",
    cities: [
      "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura",
      "Iquitos", "Cusco", "Chimbote", "Huancayo", "Tacna",
      "Juliaca", "Ica", "Sullana", "Ayacucho", "Cajamarca",
      "Pucallpa", "Huánuco", "Tarapoto", "Puno", "Tumbes",
      "Talara", "Huaraz", "Pisco", "Moquegua", "Huaral",
      "Chincha Alta", "Cerro de Pasco", "Abancay", "Moyobamba", "Puerto Maldonado",
    ],
  },
  {
    code: "ec",
    name: "Ecuador",
    locale: "es",
    cities: [
      "Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala",
      "Durán", "Manta", "Portoviejo", "Loja", "Ambato",
      "Esmeraldas", "Riobamba", "Quevedo", "Milagro", "Ibarra",
      "Latacunga", "Babahoyo", "Tulcán", "Sangolquí", "Daule",
      "Nueva Loja", "Otavalo", "Salinas", "Tena", "Puyo",
    ],
  },
  {
    code: "bo",
    name: "Bolivia",
    locale: "es",
    cities: [
      "La Paz", "Santa Cruz de la Sierra", "Cochabamba", "El Alto", "Sucre",
      "Oruro", "Tarija", "Potosí", "Sacaba", "Montero",
      "Trinidad", "Quillacollo", "Riberalta", "Yacuíba", "Cobija",
      "Tupiza", "Villazón", "Camiri", "Llallagua", "Viacha",
    ],
  },
  {
    code: "py",
    name: "Paraguay",
    locale: "es",
    cities: [
      "Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Capiatá",
      "Lambaré", "Fernando de la Mora", "Limpio", "Ñemby", "Encarnación",
      "Mariano Roque Alonso", "Pedro Juan Caballero", "Itauguá", "Villa Elisa",
      "Caaguazú", "Coronel Oviedo", "Concepción", "Villarrica", "Pilar", "Caacupé",
    ],
  },
  {
    code: "uy",
    name: "Uruguay",
    locale: "es",
    cities: [
      "Montevideo", "Salto", "Ciudad de la Costa", "Paysandú", "Las Piedras",
      "Rivera", "Maldonado", "Tacuarembó", "Melo", "Mercedes",
      "Artigas", "Minas", "San José de Mayo", "Durazno", "Florida",
      "Punta del Este", "Colonia del Sacramento", "Treinta y Tres", "Rocha", "Fray Bentos",
    ],
  },
  {
    code: "pa",
    name: "Panamá",
    locale: "es",
    cities: [
      "Ciudad de Panamá", "San Miguelito", "Tocumen", "David", "Colón",
      "Las Cumbres", "La Chorrera", "Santiago de Veraguas", "Chitré", "Penonomé",
      "Arraiján", "Aguadulce", "Changuinola", "Bocas del Toro", "Las Tablas",
    ],
  },
  {
    code: "cr",
    name: "Costa Rica",
    locale: "es",
    cities: [
      "San José", "Alajuela", "Cartago", "Heredia", "Liberia",
      "Puntarenas", "Limón", "Pérez Zeledón", "Desamparados", "San Carlos",
      "Pococí", "Curridabat", "Escazú", "Santa Ana", "Grecia",
      "Turrialba", "Nicoya", "Quepos", "Jacó", "Tamarindo",
    ],
  },
  {
    code: "do",
    name: "República Dominicana",
    locale: "es",
    cities: [
      "Santo Domingo", "Santiago de los Caballeros", "Santo Domingo Este",
      "Santo Domingo Oeste", "Santo Domingo Norte", "La Romana", "San Pedro de Macorís",
      "San Cristóbal", "Puerto Plata", "La Vega", "San Francisco de Macorís",
      "Higüey", "Moca", "Bonao", "Baní", "Punta Cana", "Barahona",
      "Bávaro", "Boca Chica", "Azua",
    ],
  },
  {
    code: "gt",
    name: "Guatemala",
    locale: "es",
    cities: [
      "Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla",
      "Chinautla", "Chimaltenango", "Huehuetenango", "Amatitlán", "Cobán",
      "Petapa", "Antigua Guatemala", "Mazatenango", "Puerto Barrios", "Retalhuleu",
      "Jalapa", "Totonicapán", "Sololá", "Zacapa", "Chiquimula",
    ],
  },
  {
    code: "hn",
    name: "Honduras",
    locale: "es",
    cities: [
      "Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso",
      "Comayagua", "Choluteca", "Puerto Cortés", "Danlí", "Juticalpa",
      "Siguatepeque", "Tela", "Catacamas", "Santa Rosa de Copán", "Tocoa",
      "La Lima", "Olanchito", "Roatán", "Comayagüela", "Villanueva",
    ],
  },
  {
    code: "sv",
    name: "El Salvador",
    locale: "es",
    cities: [
      "San Salvador", "Soyapango", "Santa Ana", "San Miguel", "Mejicanos",
      "Santa Tecla", "Apopa", "Delgado", "Sonsonate", "Usulután",
      "Ahuachapán", "Cojutepeque", "Zacatecoluca", "San Marcos", "Ilopango",
      "Chalatenango", "La Unión", "Metapán", "Acajutla", "La Libertad",
    ],
  },
  {
    code: "ni",
    name: "Nicaragua",
    locale: "es",
    cities: [
      "Managua", "León", "Masaya", "Matagalpa", "Chinandega",
      "Granada", "Estelí", "Tipitapa", "Jinotega", "Nueva Guinea",
      "Bluefields", "Juigalpa", "Jinotepe", "Rivas", "Ocotal",
      "Boaco", "Somoto", "San Carlos", "Diriamba", "San Juan del Sur",
    ],
  },
  {
    code: "cu",
    name: "Cuba",
    locale: "es",
    cities: [
      "La Habana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara",
      "Guantánamo", "Bayamo", "Las Tunas", "Cienfuegos", "Pinar del Río",
      "Matanzas", "Ciego de Ávila", "Sancti Spíritus", "Manzanillo", "Cárdenas",
      "Palma Soriano", "Trinidad", "Varadero", "Baracoa", "Nueva Gerona",
    ],
  },
  {
    code: "pr",
    name: "Puerto Rico",
    locale: "es",
    cities: [
      "San Juan", "Bayamón", "Carolina", "Ponce", "Caguas",
      "Guaynabo", "Mayagüez", "Trujillo Alto", "Arecibo", "Fajardo",
      "Vega Baja", "Humacao", "Aguadilla", "Río Grande", "Manatí",
      "Cayey", "Yauco", "Guayama", "Toa Baja", "Dorado",
    ],
  },
  {
    code: "ad",
    name: "Andorra",
    locale: "es",
    cities: [
      "Andorra la Vieja", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria",
      "La Massana", "Santa Coloma", "Ordino", "Canillo", "Pas de la Casa", "Arinsal",
    ],
  },
  {
    code: "gq",
    name: "Guinea Ecuatorial",
    locale: "es",
    cities: [
      "Malabo", "Bata", "Ebebiyín", "Aconibe", "Añisoc",
      "Luba", "Evinayong", "Mongomo", "Mbini", "Riaba",
    ],
  },
  {
    code: "us",
    name: "Estados Unidos",
    locale: "en",
    cities: [
      "Nueva York", "Los Ángeles", "Chicago", "Houston", "Phoenix",
      "Filadelfia", "San Antonio", "San Diego", "Dallas", "Miami",
      "Las Vegas", "San Francisco", "Orlando", "Austin", "El Paso",
      "Atlanta", "Boston", "Denver", "Seattle", "Washington D. C.",
    ],
  },
  {
    code: "br",
    name: "Brasil",
    locale: "pt",
    cities: [
      "São Paulo", "Río de Janeiro", "Brasilia", "Salvador", "Fortaleza",
      "Belo Horizonte", "Manaos", "Curitiba", "Recife", "Porto Alegre",
      "Belém", "Goiânia", "Guarulhos", "Campinas", "Florianópolis",
      "Natal", "Maceió", "São Luís", "João Pessoa", "Cuiabá",
    ],
  },
];
