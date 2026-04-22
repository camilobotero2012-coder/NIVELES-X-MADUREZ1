/**
 * ARCHIVO DE PRUEBA Y EJEMPLO
 * 
 * Este archivo muestra cómo usar el CalculadorMaturez con respuestas de ejemplo
 */

// EJEMPLO DE RESPUESTAS (en producción vendrían del formulario)
const respuestasEjemplo = {
  // DIMENSIÓN 1: ESTRATEGIA (Preguntas 1-8)
  'Q1': 0.66,   // Vamos bien
  'Q2': 1,      // Excelente
  'Q3': 0.33,   // Iniciando

  'Q4': 0.66,
  'Q5': 0.66,
  'Q6': 0.33,
  'Q7': 1,
  'Q8': 0.66,

  // DIMENSIÓN 2: OPERACIONAL (Preguntas 9-20)
  'Q9': 0.66,
  'Q10': 0.66,
  'Q11': 0.33,
  'Q12': 0.66,
  'Q13': 1,
  'Q14': 0.66,
  'Q15': 0.33,
  'Q16': 0.66,
  'Q17': 0.66,
  'Q18': 0.66,
  'Q19': 0.33,
  'Q20': 0.66,

  // DIMENSIÓN 3: TECNOLOGÍA (Preguntas 21-34)
  'Q21': 0.33,
  'Q22': 0.66,
  'Q23': 0.33,
  'Q24': 0.66,
  'Q25': 0.33,
  'Q26': 0.66,
  'Q27': 0.33,
  'Q28': 0.66,
  'Q29': 0.33,
  'Q30': 0.66,
  'Q31': 0.33,
  'Q32': 0.66,
  'Q33': 0.33,
  'Q34': 0.66,

  // DIMENSIÓN 4: PERSONAS (Preguntas 35-46)
  'Q35': 1,
  'Q36': 1,
  'Q37': 0.66,
  'Q38': 0.66,
  'Q39': 0.66,
  'Q40': 0.66,
  'Q41': 0.66,
  'Q42': 1,
  'Q43': 0.66,
  'Q44': 0.66,
  'Q45': 0.66,
  'Q46': 1,

  // DIMENSIÓN 5: RESULTADOS (Preguntas 47-54)
  'Q47': 0.66,
  'Q48': 0.66,
  'Q49': 0.33,
  'Q50': 0.66,
  'Q51': 0.66,
  'Q52': 0.33,
  'Q53': 0.66,
  'Q54': 0.66
};

/**
 * FUNCIÓN PARA EJECUTAR EL EJEMPLO
 */
async function ejecutarEjemplo() {
  console.clear();
  console.log('🚀 INICIANDO EJEMPLO DE CÁLCULO DE MADUREZ\n');

  try {
    // 1. Cargar estructura
    console.log('📥 Cargando estructura...');
    const respuesta = await fetch('estructura-encuesta.json');
    if (!respuesta.ok) throw new Error(`HTTP error! status: ${respuesta.status}`);
    const estructura = await respuesta.json();
    console.log('✅ Estructura cargada\n');

    // 2. Crear calculadora
    console.log('⚙️  Inicializando calculadora...');
    const calc = new CalculadorMaturez(estructura);
    console.log('✅ Calculadora lista\n');

    // 3. Mostrar estructura
    console.log('📊 ESTRUCTURA DE LA ENCUESTA:');
    console.log(JSON.stringify(calc.exportarEstructura(), null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // 4. Calcular score
    console.log('🧮 CALCULANDO PUNTUACIÓN...\n');
    const resultado = calc.calcularScore(respuestasEjemplo);

    // 5. Mostrar resultado básico
    console.log('📈 RESULTADO CALCULADO:');
    console.log(`   Score Total: ${resultado.total} / ${estructura.puntajeMaxTotal}`);
    console.log(`   Porcentaje: ${resultado.totalPorcentaje}%`);
    console.log(`   Nivel: ${resultado.nivelMadurez}`);
    console.log(`\n   Validación: ${resultado.detalles.respuestasRecibidas}/${resultado.detalles.respuestasEsperadas} respuestas recibidas`);

    if (resultado.detalles.validacion.length > 0) {
      console.log('\n   Notas de validación:');
      resultado.detalles.validacion.forEach(nota => console.log(`   ${nota}`));
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // 6. Mostrar desglose por dimensión
    console.log('📋 DESGLOSE POR DIMENSIÓN:');
    resultado.dimensiones.forEach(dim => {
      console.log(`\n   ${dim.nombreDimension.toUpperCase()}`);
      console.log(`   ${'─'.repeat(40)}`);
      console.log(`   Score: ${dim.score} / ${dim.scoreMaximo} (${dim.porcentaje}%)`);
      console.log(`   Parámetros:`);
      dim.parametros.forEach(param => {
        const barraLength = Math.round(param.porcentaje / 5);
        const barra = '█'.repeat(barraLength) + '░'.repeat(20 - barraLength);
        console.log(`     • ${param.nombreParametro.padEnd(30)} [${barra}] ${param.porcentaje}%`);
      });
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // 7. Generar reporte completo
    console.log('📑 REPORTE COMPLETO:');
    const reporte = calc.generarReporte(resultado);
    console.log(JSON.stringify(reporte, null, 2));

    console.log('\n' + '='.repeat(80) + '\n');

    // 8. Mostrar JSON completo del resultado
    console.log('🔍 RESULTADO COMPLETO (JSON):');
    console.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar si se carga desde el navegador
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', ejecutarEjemplo);
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { respuestasEjemplo, ejecutarEjemplo };
}
