# 🔒 Guía de Validación y Casos de Uso

## 1️⃣ Validación de Sesión - Casos Prácticos

### Caso 1: Usuario intenta acceder a /survey sin registro

**Flujo:**
```
Usuario digita: ejemplo.com/survey
      ↓
App carga ProtectedRoute
      ↓
ProtectedRoute valida: ¿isAuthenticated = true?
      ✗ NO
      ↓
Redirigir a /register
      ↓
Mostrar: "Primero debes registrar tu empresa"
```

**Código de Validación:**
```javascript
function validateOAuth() {
  const savedAuth = localStorage.getItem('session');
  
  if (!savedAuth) {
    // No hay sesión
    showMessage("Primero debes registrar tu empresa");
    window.location.href = '/register';
    return false;
  }
  
  try {
    const auth = JSON.parse(savedAuth);
    
    // Validar que tenga propiedades requeridas
    if (!auth.companyId || !auth.userId) {
      throw new Error("Sesión corrupta");
    }
    
    // Validar que no sea muy antigua (ej: +30 días)
    const registeredAt = new Date(auth.registeredAt);
    const daysSinceRegister = (Date.now() - registeredAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRegister > 30) {
      // Sesión muy antigua, renovar
      localStorage.removeItem('session');
      window.location.href = '/register';
      return false;
    }
    
    return true;
  } catch (error) {
    // Sesión inválida
    localStorage.removeItem('session');
    window.location.href = '/register';
    return false;
  }
}
```

---

### Caso 2: Usuario completa registro exitosamente

**Flujo:**
```
Usuario envía formulario
      ↓
Validar datos localmente
      ✓ OK
      ↓
POST /api/companies/register
      ↓ [Esperando respuesta del backend]
Backend crea empresa y usuario
      ↓
Retorna response con company.id, user.id
      ↓
Frontend guarda sesión en localStorage
      ↓
Actualiza estado global (AuthContext)
      ↓
navigate('/survey')
      ↓
Encuesta cargada exitosamente ✓
```

**Flujo de Código:**
```javascript
async function handleRegisterSubmit(formData) {
  // 1. VALIDACIÓN LOCAL
  const validation = validateForm(formData);
  if (validation.errors.length > 0) {
    displayErrors(validation.errors);
    return;
  }
  
  try {
    // 2. LLAMAR API
    const response = await fetch('/api/companies/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: {
          name: formData.nombreEmpresa,
          industry: formData.industria,
          size: formData.tamano,
          country: formData.pais
        },
        user: {
          name: formData.nombreUsuario,
          email: formData.email
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // 3. PROCESAR RESPUESTA
    const data = await response.json();
    
    // 4. GUARDAR SESIÓN
    const sessionData = {
      isAuthenticated: true,
      companyId: data.company.id,
      userId: data.user.id,
      companyName: data.company.name,
      userName: data.user.name,
      email: data.user.email,
      industry: data.company.industry,
      country: data.company.country,
      companySize: data.company.size,
      registeredAt: new Date().toISOString()
    };
    
    localStorage.setItem('session', JSON.stringify(sessionData));
    
    // 5. ACTUALIZAR CONTEXTO
    authContext.login(sessionData);
    
    // 6. MOSTRAR MENSAJE Y REDIRIGIR
    showSuccess("¡Bienvenido! Tu empresa ha sido registrada");
    setTimeout(() => {
      window.location.href = '/survey';
    }, 1000);
    
  } catch (error) {
    console.error('Error en registro:', error);
    showError('Error al registrar: ' + error.message);
  }
}
```

---

### Caso 3: Usuario ya registrado intenta acceder a /landing

**Flujo:**
```
Usuario registrado intenta ir a /landing
      ↓
Landing.jsx cargado
      ↓
useEffect verifica: ¿hay sesión válida?
      ✓ SÍ
      ↓
Redirigir a /survey automáticamente
(El usuario vuelve directo a donde estaba)
```

**Código:**
```javascript
function Landing() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Si ya está autenticado, ir directamente a la encuesta
    if (isAuthenticated) {
      navigate('/survey', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (isAuthenticated) {
    return null; // Evitar renderizar mientras redirige
  }
  
  return (
    <div className="landing">
      <h1>Evaluación de Madurez Comercial</h1>
      <p>Registra tu empresa para comenzar la evaluación</p>
      <button onClick={() => navigate('/register')}>
        Registrar Empresa
      </button>
    </div>
  );
}
```

---

### Caso 4: Usuario cierra sesión

**Flujo:**
```
Usuario click en "Cerrar sesión"
      ↓
logout() ejecutado
      ↓
Eliminar localStorage('session')
      ↓
Limpiar estado global
      ↓
Redirigir a /landing
      ↓
Usuario vuelve a pantalla inicial
```

**Código:**
```javascript
function logout() {
  // 1. Limpiar localStorage
  localStorage.removeItem('session');
  
  // 2. Limpiar contexto
  authContext.logout();
  
  // 3. Redirigir
  navigate('/landing');
  
  // 4. Mostrar mensaje (opcional)
  showMessage('Sesión cerrada correctamente');
}
```

---

## 2️⃣ Validaciones del Formulario de Registro

### Validador Completo

```javascript
const VALIDATION_RULES = {
  nombreEmpresa: {
    required: true,
    minLength: 3,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-&.,áéíóúñ]+$/,
    message: "Nombre de empresa: 3-255 caracteres (sin caracteres especiales)"
  },
  
  industria: {
    required: true,
    validOptions: [
      'Technology', 'Finance', 'Retail', 'Manufacturing', 
      'Healthcare', 'Education', 'Other'
    ],
    message: "Debes seleccionar una industria válida"
  },
  
  pais: {
    required: true,
    minLength: 2,
    message: "Debes seleccionar un país"
  },
  
  nombreUsuario: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-áéíóúñ]+$/,
    message: "Nombre: 3-100 caracteres (solo letras)"
  },
  
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email inválido"
  }
};

function validateForm(formData) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const value = formData[field];
    
    // Validar obligatorio
    if (rules.required && (!value || value.trim() === '')) {
      errors.push(`${field}: requerido`);
      continue;
    }
    
    // Validar longitud mínima
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${field}: mínimo ${rules.minLength} caracteres`);
    }
    
    // Validar longitud máxima
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field}: máximo ${rules.maxLength} caracteres`);
    }
    
    // Validar patrón
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${field}: formato inválido`);
    }
    
    // Validar opciones válidas
    if (rules.validOptions && !rules.validOptions.includes(value)) {
      errors.push(`${field}: opción inválida`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Uso:
const validation = validateForm(formData);
if (!validation.isValid) {
  validation.errors.forEach(error => console.error(error));
}
```

---

## 3️⃣ Estados Posibles de la Aplicación

### Estado 1: Usuario No Autenticado

```javascript
{
  isAuthenticated: false,
  session: null,
  rutasDisponibles: ['/landing', '/register'],
  rutasProtegidas: REDIRIGIDAS a '/register'
}
```

### Estado 2: Usuario en Proceso de Registro

```javascript
{
  isAuthenticated: false,
  session: null,
  formData: { /* datos parciales */ },
  loading: true,
  errors: null,
  currentPage: '/register'
}
```

### Estado 3: Usuario Autenticado (Sesión Activa)

```javascript
{
  isAuthenticated: true,
  session: {
    companyId: "uuid-xxx",
    userId: "uuid-yyy",
    companyName: "Acme Corp",
    userName: "Juan Pérez",
    email: "juan@acme.com",
    industria: "Technology",
    country: "Mexico",
    companySize: "medium"
  },
  rutasDisponibles: ['/landing', '/register', '/survey', '/results'],
  landing: REDIRIGE automáticamente a '/survey'
}
```

---

## 4️⃣ Manejo de Errores

### Errores Comunes y Respuestas

```javascript
const ERROR_HANDLERS = {
  // Error: Email ya existe
  EMAIL_ALREADY_EXISTS: {
    code: 409,
    message: "Este email ya está registrado",
    action: "Intenta con otro email",
    userMessage: "El email ya está en uso. ¿Ya tienes cuenta?"
  },
  
  // Error: Empresa no encontrada
  COMPANY_NOT_FOUND: {
    code: 404,
    message: "Empresa no encontrada",
    action: "Redirigir a registro",
    userMessage: "Tu sesión ha expirado. Por favor registrate nuevamente"
  },
  
  // Error: Validación fallida
  VALIDATION_ERROR: {
    code: 400,
    message: "Datos incompletos o inválidos",
    action: "Mostrar errores en forma",
    userMessage: "Por favor completa todos los campos correctamente"
  },
  
  // Error: Servidor
  SERVER_ERROR: {
    code: 500,
    message: "Error interno del servidor",
    action: "Reintentar después",
    userMessage: "Algo salió mal. Intenta más tarde"
  },
  
  // Error: Sin conexión
  NETWORK_ERROR: {
    code: 0,
    message: "Sin conexión a internet",
    action: "Reintentar cuando haya conexión",
    userMessage: "Verifica tu conexión a internet"
  }
};

async function handleAPICall(endpoint, method, data) {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorHandler = ERROR_HANDLERS[errorData.code] || 
                          ERROR_HANDLERS.SERVER_ERROR;
      throw new Error(errorHandler.userMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Error de red
      console.error(ERROR_HANDLERS.NETWORK_ERROR.message);
      throw new Error(ERROR_HANDLERS.NETWORK_ERROR.userMessage);
    }
    throw error;
  }
}
```

---

## 5️⃣ Pruebas de Seguridad

### Test 1: No se puede acceder a /survey sin registro

```javascript
// ANTES del registro
test('Usuario sin registro no puede acceder a /survey', () => {
  localStorage.removeItem('session');
  
  visit('/survey');
  
  // Debe redirigir a /register
  expect(window.location.pathname).toBe('/register');
  expect(getDisplayedMessage()).toContain("Primero debes registrar");
});
```

### Test 2: Registro exitoso redirige a /survey

```javascript
test('Registro exitoso redirige a /survey', async () => {
  const formData = {
    nombreEmpresa: 'Test Corp',
    industria: 'Technology',
    tamano: 'medium',
    pais: 'Mexico',
    nombreUsuario: 'Test User',
    email: 'test@corp.com'
  };
  
  fillForm(formData);
  clickButton('Registrar y Continuar');
  
  await waitFor(() => {
    expect(window.location.pathname).toBe('/survey');
  });
  
  expect(localStorage.getItem('session')).not.toBeNull();
});
```

### Test 3: Usuario ya registrado va directo a /survey

```javascript
test('Usuario registrado accede directamente a /survey', () => {
  const session = {
    isAuthenticated: true,
    companyId: 'test-id',
    userId: 'user-id'
  };
  
  localStorage.setItem('session', JSON.stringify(session));
  
  visit('/landing');
  
  // Redirige automáticamente
  expect(window.location.pathname).toBe('/survey');
});
```

### Test 4: Cerrar sesión limpia todo

```javascript
test('Logout limpia sesión y redirige a landing', () => {
  const session = {
    isAuthenticated: true,
    companyId: 'test-id'
  };
  
  localStorage.setItem('session', JSON.stringify(session));
  
  clickButton('Cerrar Sesión');
  
  expect(localStorage.getItem('session')).toBeNull();
  expect(window.location.pathname).toBe('/landing');
});
```

---

## 6️⃣ Flujos de Edge Cases

### Edge Case 1: Usuario intenta modificar sessionID manualmente

```javascript
// Usuario modifica localStorage con datos falsos
localStorage.setItem('session', JSON.stringify({
  isAuthenticated: true,
  companyId: 'fake-id',
  userId: 'fake-user'
}));

// Al intentar guardar respuesta de encuesta:
// POST /api/survey/responses { company_id: 'fake-id', ... }
//
// Backend valida que company_id existe → NO EXISTE
// Retorna 404 "Empresa no encontrada"
//
// Frontend detecta error → Limpia sesión → Redirige a /register
// Mostrar: "Tu sesión ha expirado"
```

### Edge Case 2: Usuario registra pero pierdeconexión antes de guardar sesión

```javascript
// POST /api/companies/register
// Respuesta exitosa BUT conexión se pierde antes de parsear
//
// Frontend: no sabe si el registro fue exitoso
// Solución: Reintentar con validación backend
// Backend: Si el email ya existe → retornar 409
// Frontend: Preguntar "¿Ya tienes cuenta? Intenta iniciar sesión"
```

### Edge Case 3: Token/sesión expira durante la encuesta

```javascript
// Usuario está en encuesta, sesión se vence
// Intenta guardar respuesta:
// POST /api/survey/responses
// Backend valida sesión → EXPIRADA
// Retorna 401 "Unauthorized"
//
// Frontend:
// → Limpiar localStorage
// → Redirigir a /register
// → Mostrar: "Tu sesión expiró. Por favor registrate nuevamente"
// → El usuario puede volver a registrarse sin perder datos
```

---

## 7️⃣ Resumen de Control de Acceso

| Ruta | Usuario Sin Registro | Usuario Registrado |
|------|:---:|:---:|
| / | Redirige a /landing | Redirige a /landing |
| /landing | ✅ Permitido | Redirige a /survey |
| /register | ✅ Permitido | Redirige a /survey |
| /survey | ❌ **Redirige a /register** con mensaje | ✅ Permitido |
| /results | ❌ **Redirige a /register** con mensaje | ✅ Permitido |
| /logout | ❌ Sin efecto | ✅ Limpia y va a /landing |

---

**Con esta guía tienes todos los escenarios cubiertos. ¡Listo para implementar! 🚀**
