/**
 * SISTEMA DE PUNTUACIÓN - ENCUESTA DE MADUREZ COMERCIAL
 * 
 * LÓGICA FUNDAMENTAL:
 * ==================
 * 
 * 1. ESTRUCTURA JERÁRQUICA:
 *    Dimensión (5) → Parámetro (19) → Pregunta (54)
 * 
 * 2. DISTRIBUCIÓN DE PUNTOS:
 *    - puntosMax de Dimensión = suma(puntosMax de sus Parámetros)
 *    - puntosMax de Parámetro = suma(puntosMax de sus Preguntas)
 *    - Total máximo = 5 puntos (20% × 5 dimensiones)
 * 
 * 3. CÁLCULO DE SCORES:
 *    - scoreP = valorSeleccionado × puntosMaxPregunta
 *    - scoreParam = suma(scoreP) para todas las preguntas del parámetro
 *    - scoreDim = suma(scoreParam) para todos los parámetros de la dimensión
 *    - scoreTotal = suma(scoreDim) para todas las dimensiones
 * 
 * 4. ESCALA DE RESPUESTA:
 *    - 0 = No iniciado (0%)
 *    - 0.33 = En desarrollo (33%)
 *    - 0.66 = Implementado (66%)
 *    - 1 = Optimizado (100%)
 * 
 * 5. IMPORTANTE:
 *    - Parámetros y Preguntas sirven para DISTRIBUIR el peso
 *    - El score FINAL solo suma las DIMENSIONES
 *    - Sin parámetros/preguntas, el resultado sería 0 (no hay base)
 *    - Solo se usan como contenedores de la lógica
 */

class CalculadorMaturez {
  constructor(estructura) {
    this.estructura = estructura;
    this.validar();
  }

  /**
   * VALIDACIÓN CRÍTICA
   * Verifica que la estructura sea correcta antes de hacer cálculos
   */
  validar() {
    console.log('📋 Validando estructura...');

    // Validar dimensiones
    if (!this.estructura.dimensiones || this.estructura.dimensiones.length === 0) {
      throw new Error('❌ No hay dimensiones definidas');
    }

    let sumaPuntosMaxDimensiones = 0;
    let sumaPreguntasTotal = 0;

    this.estructura.dimensiones.forEach((dim, idxDim) => {
      // Verificar que tiene parámetros
      if (!dim.parametros || dim.parametros.length === 0) {
        throw new Error(`❌ Dimensión "${dim.nombre}" no tiene parámetros`);
      }

      let sumaPuntosMaxParametros = 0;

      dim.parametros.forEach((param, idxParam) => {
        // Verificar que tiene preguntas
        if (!param.preguntas || param.preguntas.length === 0) {
          throw new Error(`❌ Parámetro "${param.nombre}" en "${dim.nombre}" no tiene preguntas`);
        }

        let sumaPuntosMaxPreguntas = 0;

        param.preguntas.forEach((pregunta, idxPregunta) => {
          // Validar que pregunta tenga puntosMax > 0
          if (!pregunta.puntosMax || pregunta.puntosMax === 0) {
            throw new Error(`❌ Pregunta "${pregunta.id}" tiene puntosMax = 0 o no definido`);
          }

          sumaPuntosMaxPreguntas += pregunta.puntosMax;
        });

        // Validar que suma de preguntas ≈ puntosMax del parámetro (tolerancia 0.01)
        const diferencia = Math.abs(sumaPuntosMaxPreguntas - param.puntosMax);
        if (diferencia > 0.01) {
          console.warn(
            `⚠️  Parámetro "${param.nombre}": suma preguntas (${sumaPuntosMaxPreguntas.toFixed(3)}) ` +
            `!= puntosMax (${param.puntosMax.toFixed(3)}). Diferencia: ${diferencia.toFixed(3)}`
          );
        }

        sumaPuntosMaxParametros += param.puntosMax;
      });

      // Validar que suma de parámetros ≈ puntosMax de dimensión
      const diferencia = Math.abs(sumaPuntosMaxParametros - dim.puntosMax);
      if (diferencia > 0.01) {
        console.warn(
          `⚠️  Dimensión "${dim.nombre}": suma parámetros (${sumaPuntosMaxParametros.toFixed(3)}) ` +
          `!= puntosMax (${dim.puntosMax.toFixed(3)}). Diferencia: ${diferencia.toFixed(3)}`
        );
      }

      sumaPuntosMaxDimensiones += dim.puntosMax;
      sumaPreguntasTotal += dim.parametros.reduce((acc, p) => acc + p.preguntas.length, 0);
    });

    // Validar que suma de dimensiones = 5 (o cercano)
    const diferenciafinal = Math.abs(sumaPuntosMaxDimensiones - this.estructura.puntajeMaxTotal);
    if (diferenciafinal > 0.01) {
      throw new Error(
        `❌ Suma de puntosMax dimensiones (${sumaPuntosMaxDimensiones.toFixed(3)}) ` +
        `!= puntajeMaxTotal (${this.estructura.puntajeMaxTotal})`
      );
    }

    console.log(`✅ Validación exitosa`);
    console.log(`   - Dimensiones: ${this.estructura.dimensiones.length}`);
    console.log(`   - Parámetros: ${this.estructura.dimensiones.reduce((acc, d) => acc + d.parametros.length, 0)}`);
    console.log(`   - Preguntas: ${sumaPreguntasTotal}`);
    console.log(`   - Puntaje máximo total: ${sumaPuntosMaxDimensiones.toFixed(2)}`);
  }

  /**
   * CALCULAR SCORE COMPLETO
   * @param {Object} respuestas - Objeto con estructura: { Q1: 0.66, Q2: 1, ... }
   * @returns {Object} Resultado con detalles de puntuación
   */
  calcularScore(respuestas) {
    if (!respuestas || Object.keys(respuestas).length === 0) {
      throw new Error('❌ Respuestas vacías');
    }

    const resultado = {
      timestamp: new Date().toISOString(),
      total: 0,
      totalPorcentaje: 0,
      nivelMadurez: '', // Se asigna según el rango
      dimensiones: [],
      parametros: [],
      detalles: {
        respuestasRecibidas: Object.keys(respuestas).length,
        respuestasEsperadas: this._contarPreguntas(),
        validacion: []
      }
    };

    let scoreTotalAcumulado = 0;

    // PROCESAR CADA DIMENSIÓN
    this.estructura.dimensiones.forEach((dimension) => {
      let scoreDimensionAcumulado = 0;
      const parametrosDimension = [];

      // PROCESAR CADA PARÁMETRO
      dimension.parametros.forEach((parametro) => {
        let scoreParametroAcumulado = 0;

        // PROCESAR CADA PREGUNTA
        parametro.preguntas.forEach((pregunta) => {
          const valorRespuesta = respuestas[pregunta.id];

          if (valorRespuesta === undefined) {
            resultado.detalles.validacion.push(
              `⚠️  Pregunta ${pregunta.id} sin respuesta`
            );
            // Si no hay respuesta, se asume 0
            return;
          }

          // Validar que valor esté en rango [0, 1]
          if (valorRespuesta < 0 || valorRespuesta > 1) {
            throw new Error(`❌ Pregunta ${pregunta.id}: valor ${valorRespuesta} fuera de rango [0, 1]`);
          }

          // CÁLCULO: score = valor × puntosMax
          const scorePregunta = valorRespuesta * pregunta.puntosMax;
          scoreParametroAcumulado += scorePregunta;
        });

        // Score del parámetro = suma de preguntas
        const scoreParametro = {
          idParametro: parametro.id,
          nombreParametro: parametro.nombre,
          score: parseFloat(scoreParametroAcumulado.toFixed(4)),
          scoreMaximo: parseFloat(parametro.puntosMax.toFixed(4)),
          porcentaje: parseFloat(((scoreParametroAcumulado / parametro.puntosMax) * 100).toFixed(2))
        };

        parametrosDimension.push(scoreParametro);
        scoreDimensionAcumulado += scoreParametroAcumulado;
      });

      // Score de la dimensión = suma de parámetros
      const scoreDimension = {
        idDimension: dimension.id,
        nombreDimension: dimension.nombre,
        score: parseFloat(scoreDimensionAcumulado.toFixed(4)),
        scoreMaximo: parseFloat(dimension.puntosMax.toFixed(4)),
        porcentaje: parseFloat(((scoreDimensionAcumulado / dimension.puntosMax) * 100).toFixed(2)),
        parametros: parametrosDimension
      };

      resultado.dimensiones.push(scoreDimension);
      resultado.parametros.push(...parametrosDimension);
      scoreTotalAcumulado += scoreDimensionAcumulado;
    });

    // CALCULAR TOTALES
    resultado.total = parseFloat(scoreTotalAcumulado.toFixed(4));
    resultado.totalPorcentaje = parseFloat(((scoreTotalAcumulado / this.estructura.puntajeMaxTotal) * 100).toFixed(2));
    const nivelInfo = this._obtenerNivelMadurez(resultado.total);
    resultado.nivelMadurez = nivelInfo.nivel;
    resultado.descripcionNivel = nivelInfo.descripcion;

    // Validación adicional
    if (resultado.detalles.respuestasRecibidas < resultado.detalles.respuestasEsperadas) {
      resultado.detalles.validacion.push(
        `⚠️  Respuestas incompletas: ${resultado.detalles.respuestasRecibidas}/${resultado.detalles.respuestasEsperadas}`
      );
    }

    return resultado;
  }

  /**
   * DETERMINAR NIVEL DE MADUREZ
   * Basado en el score total de 0 a 5
   */
  _obtenerNivelMadurez(scoreTotal) {
    const score = Number(scoreTotal.toFixed(2));

    if (score < 1) {
      return {
        nivel: "Muy bajo",
        descripcion: "Por debajo del modelo esperado"
      };
    }

    if (score <= 1.9) return { nivel: "Operativo", descripcion: "Ejecución reactiva" };
    if (score <= 2.9) return { nivel: "Táctico", descripcion: "Acciones aisladas sin estandarización" };
    if (score <= 3.9) return { nivel: "Estructurado", descripcion: "Procesos, roles y KPIs claros" };
    if (score <= 4.4) return { nivel: "Estratégico", descripcion: "Trade integrado al negocio y decisiones por insights" };
    if (score <= 5.0) return { nivel: "Excelencia", descripcion: "Analítica avanzada e innovación constante" };

    return { nivel: "Fuera de rango", descripcion: "Error en cálculo" };
  }

  /**
   * CONTAR TOTAL DE PREGUNTAS
   */
  _contarPreguntas() {
    return this.estructura.dimensiones.reduce(
      (acc, dim) => acc + dim.parametros.reduce(
        (acc2, param) => acc2 + param.preguntas.length,
        0
      ),
      0
    );
  }

  /**
   * GENERAR REPORTE DETALLADO
   */
  generarReporte(resultado) {
    return {
      resumen: {
        scoreTotal: resultado.total,
        scoreMaximo: this.estructura.puntajeMaxTotal,
        porcentaje: resultado.totalPorcentaje,
        nivelMadurez: resultado.nivelMadurez,
        descripcionNivel: resultado.descripcionNivel,
        fecha: resultado.timestamp
      },
      
      dimensiones: resultado.dimensiones.map(dim => ({
        nombre: dim.nombreDimension,
        score: dim.score,
        porcentaje: dim.porcentaje,
        parametros: dim.parametros.map(param => ({
          nombre: param.nombreParametro,
          score: param.score,
          porcentaje: param.porcentaje
        }))
      })),

      interpretacion: this._generarInterpretacion(resultado),
      
      recomendaciones: this._generarRecomendaciones(resultado)
    };
  }

  /**
   * GENERAR INTERPRETACIÓN DEL RESULTADO
   */
  _generarInterpretacion(resultado) {
    const dim = resultado.dimensiones;
    const dimOrdenada = [...dim].sort((a, b) => b.porcentaje - a.porcentaje);

    return {
      fortalezas: dimOrdenada.slice(0, 2).map(d => ({
        dimension: d.nombreDimension,
        porcentaje: d.porcentaje
      })),
      
      areasDeImprovement: dimOrdenada.slice(-2).map(d => ({
        dimension: d.nombreDimension,
        porcentaje: d.porcentaje
      }))
    };
  }

  /**
   * GENERAR RECOMENDACIONES
   */
  _generarRecomendaciones(resultado) {
    const recomendaciones = [];

    resultado.dimensiones.forEach(dim => {
      if (dim.porcentaje < 50) {
        recomendaciones.push({
          dimension: dim.nombreDimension,
          prioridad: 'Alta',
          accion: `Enfocarse en mejorar ${dim.nombreDimension.toLowerCase()} - actualmente con ${dim.porcentaje.toFixed(1)}% de madurez`
        });
      } else if (dim.porcentaje < 75) {
        recomendaciones.push({
          dimension: dim.nombreDimension,
          prioridad: 'Media',
          accion: `Optimizar ${dim.nombreDimension.toLowerCase()} para alcanzar máximo potencial (actualmente ${dim.porcentaje.toFixed(1)}%)`
        });
      }
    });

    return recomendaciones.sort((a, b) => {
      const prioridad = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
      return prioridad[a.prioridad] - prioridad[b.prioridad];
    });
  }

  /**
   * EXPORTAR ESTRUCTURA EN FORMATO LEGIBLE
   */
  exportarEstructura() {
    return {
      nombre: this.estructura.nombre,
      version: this.estructura.version,
      totalDimensiones: this.estructura.dimensiones.length,
      totalParametros: this.estructura.dimensiones.reduce(
        (acc, d) => acc + d.parametros.length, 0
      ),
      totalPreguntas: this._contarPreguntas(),
      puntajeMaxTotal: this.estructura.puntajeMaxTotal,
      dimensiones: this.estructura.dimensiones.map(d => ({
        id: d.id,
        nombre: d.nombre,
        puntosMax: d.puntosMax,
        parametros: d.parametros.length,
        preguntas: d.parametros.reduce((acc, p) => acc + p.preguntas.length, 0)
      }))
    };
  }
}

/**
 * USO:
 * 
 * 1. Cargar estructura
 * const estructura = await fetch('estructura-encuesta.json').then(r => r.json());
 * 
 * 2. Inicializar calculadora
 * const calc = new CalculadorMaturez(estructura);
 * 
 * 3. Procesar respuestas
 * const respuestas = { Q1: 0.66, Q2: 1, Q3: 0.33, ... };
 * const resultado = calc.calcularScore(respuestas);
 * 
 * 4. Generar reporte
 * const reporte = calc.generarReporte(resultado);
 */

// ========== EXPORTAR PARA USO EN OTROS MÓDULOS ==========
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculadorMaturez;
}
