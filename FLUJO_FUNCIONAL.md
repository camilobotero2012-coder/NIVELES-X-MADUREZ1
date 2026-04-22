# 🏢 Flujo Funcional - Evaluación de Madurez Comercial

## 📊 Diagrama del Flujo

```
┌─────────────────────┐
│   Usuario Nuevo     │
│   (sin registro)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│   PANTALLA INICIAL              │
│  (/landing o /inicio)           │
│  - Botón "Registrar empresa"    │
│  - Mensaje explicativo          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   FORMULARIO DE REGISTRO        │
│   (/register)                   │
│  - Nombre empresa               │
│  - Industria                    │
│  - Tamaño empresa               │
│  - País                         │
│  - Nombre usuario               │
│  - Email                        │
└──────────┬──────────────────────┘
           │
           ▼ [Validar & Enviar]
┌─────────────────────────────────┐
│  GUARDAR EN BASE DE DATOS       │
│  - Crear registro empresa       │
│  - Generar companyId            │
│  - Crear usuario                │
│  - Generar userId               │
│  - Guardar sesión               │
└──────────┬──────────────────────┘
           │
           ▼ [Redirección automática]
┌─────────────────────────────────┐
│   ENCUESTA MATURITY             │
│   (/survey)                     │
│   - Preguntas de evaluación     │
│   - Sesión validada             │
│   - companyId + userId en uso   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  INTENTO DE ACCESO DIRECTO      │
│  (usuario sin registro)         │
└──────────┬──────────────────────┘
           │
           ▼ [Sin sesión válida]
      ❌ BLOQUEADO
           │
           ▼
   Redireccionar a /register
   + Mensaje: "Primero debes
    registrar tu empresa"
```

---

## 🛣️ Estructura de Rutas

```
/                          → Redirecciona a /landing
/landing                   → Pantalla inicial (sin protección)
/register                  → Formulario de registro (sin protección)
/survey                    → Encuesta protegida (requiere sesión)
/results                   → Resultados (requiere sesión)
/logout                    → Cerrar sesión
```

---

## 🔐 Estructura de Sesión

### Estado Global (Contexto o Store)

```javascript
{
  isAuthenticated: boolean,    // ¿Hay sesión activa?
  companyId: string,           // ID único de empresa (UUID o similar)
  userId: string,              // ID único de usuario
  companyName: string,         // Nombre de la empresa
  userName: string,            // Nombre del usuario
  email: string,               // Email del usuario
  industry: string,            // Industria de la empresa
  country: string,             // País
  companySize: string,         // Tamaño (small, medium, large, enterprise)
  registeredAt: timestamp,     // Cuándo se registró
}
```

---

## 📝 Schemas de Base de Datos

### Tabla: companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: survey_responses (Opcional)
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  question_id VARCHAR(50),
  answer INTEGER (0-5 escala de madurez),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧠 Pseudocódigo Principal

### 1. Inicialización de App

```pseudocode
FUNCIÓN init():
  sesion = obtenerDelLocalStorage("session") OU null
  
  SI sesion existe Y es valida:
    cargarEstadoGlobal(sesion)
    isAuthenticated = true
  SINO:
    isAuthenticated = false
    sesion = null
  FIN SI
  
  // Proteger rutas
  setupRoutesProtection()
END FUNCIÓN
```

### 2. Protector de Rutas

```pseudocode
FUNCIÓN setupRoutesProtection():
  PARA cada ruta en app:
    CREAR middleware antes de renderizar
    
    SI ruta == "/survey" O "/results":
      SI NOT isAuthenticated:
        MOSTRAR: "Primero debes registrar tu empresa"
        REDIRIGIR a "/register"
      SINO:
        PERMITIR acceso
        INYECTAR companyId y userId en componente
      FIN SI
    SINO:
      PERMITIR acceso
    FIN SI
  FIN PARA
END FUNCIÓN
```

### 3. Registro de Empresa

```pseudocode
FUNCIÓN registrarEmpresa(datos):
  // Validar datos
  SI NOT validar(datos):
    MOSTRAR errores de validación
    RETORNAR false
  FIN SI
  
  // Llamar API
  respuesta = POST /api/companies/register {
    name: datos.nombreEmpresa,
    industry: datos.industria,
    size: datos.tamano,
    country: datos.pais,
    user: {
      name: datos.nombreUsuario,
      email: datos.email
    }
  }
  
  SI respuesta.success:
    // Crear sesión
    sesion = {
      isAuthenticated: true,
      companyId: respuesta.company.id,
      userId: respuesta.user.id,
      companyName: respuesta.company.name,
      userName: respuesta.user.name,
      email: respuesta.user.email,
      industry: respuesta.company.industry,
      country: respuesta.company.country,
      companySize: respuesta.company.size
    }
    
    // Guardar sesión
    guardarEnLocalStorage("session", sesion)
    
    // Actualizar estado global
    cargarEstadoGlobal(sesion)
    isAuthenticated = true
    
    // REDIRIGIR a encuesta
    navigate("/survey")
    MOSTRAR: "¡Bienvenido! Tu empresa ha sido registrada correctamente"
    
  SINO:
    MOSTRAR: respuesta.error
    RETORNAR false
  FIN SI
END FUNCIÓN
```

### 4. Acceso a la Encuesta (Guard)

```pseudocode
FUNCIÓN accederASurvey():
  sesion = obtenerDelLocalStorage("session")
  
  SI sesion == null:
    REDIRIGIR a "/register"
    MOSTRAR: "Primero debes registrar tu empresa"
    RETORNAR false
  FIN SI
  
  SI NOT validarSesion(sesion):
    LIMPIAR sesión expirada
    REDIRIGIR a "/register"
    RETORNAR false
  FIN SI
  
  // Cargar datos de sesión
  companyId = sesion.companyId
  userId = sesion.userId
  
  // Renderizar encuesta con datos
  RETORNAR true
END FUNCIÓN
```

### 5. Guardar Respuestas de Encuesta

```pseudocode
FUNCIÓN guardarRespuestaEncuesta(preguntaId, respuesta):
  sesion = obtenerDelLocalStorage("session")
  
  // Validar que hay sesión
  SI NOT sesion:
    MOSTRAR: "Sesión expirada"
    REDIRIGIR a "/register"
    RETORNAR false
  FIN SI
  
  respuestaData = {
    company_id: sesion.companyId,
    user_id: sesion.userId,
    question_id: preguntaId,
    answer: respuesta
  }
  
  POST /api/survey/responses {
    ...respuestaData
  }
END FUNCIÓN
```

### 6. Logout

```pseudocode
FUNCIÓN logout():
  LIMPIAR localStorage ("session")
  isAuthenticated = false
  REDIRIGIR a "/landing"
END FUNCIÓN
```

---

## 🛡️ Validaciones

### Validar Formulario de Registro

```pseudocode
FUNCIÓN validar(datos):
  errores = []
  
  SI datos.nombreEmpresa.trim() == "":
    errores.push("El nombre de empresa es obligatorio")
  FIN SI
  
  SI datos.industria == "":
    errores.push("Debes seleccionar una industria")
  FIN SI
  
  SI datos.pais == "":
    errores.push("Debes seleccionar un país")
  FIN SI
  
  SI datos.nombreUsuario.trim() == "":
    errores.push("El nombre de usuario es obligatorio")
  FIN SI
  
  SI NOT esEmailValido(datos.email):
    errores.push("Email no válido")
  FIN SI
  
  RETORNAR (errores.length == 0) ? true : errores
END FUNCIÓN

FUNCIÓN esEmailValido(email):
  regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  RETORNAR regex.test(email)
END FUNCIÓN
```

---

## 🔌 Endpoints API Necesarios

### 1. Registrar Empresa y Usuario

```
POST /api/companies/register

Request:
{
  "company": {
    "name": "Tech Solutions Inc",
    "industry": "Technology",
    "size": "medium",
    "country": "Mexico"
  },
  "user": {
    "name": "Juan Pérez",
    "email": "juan@techsolutions.com"
  }
}

Response (200):
{
  "success": true,
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Solutions Inc",
    "industry": "Technology",
    "size": "medium",
    "country": "Mexico"
  },
  "user": {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Juan Pérez",
    "email": "juan@techsolutions.com"
  }
}
```

### 2. Guardar Respuesta de Encuesta

```
POST /api/survey/responses

Request:
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "question_id": "Q001",
  "answer": 4
}

Response (201):
{
  "success": true,
  "response_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### 3. Obtener Resultados

```
GET /api/survey/results?company_id=550e8400-e29b-41d4-a716-446655440000

Response (200):
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Tech Solutions Inc",
  "total_questions": 50,
  "answered_questions": 50,
  "maturity_level": 3,
  "maturity_percentage": 60,
  "results_by_dimension": {
    "strategic": { score: 3, percentage: 60 },
    "operational": { score: 3.5, percentage: 70 },
    "technical": { score: 2.5, percentage: 50 }
  }
}
```

---

## 💾 Estructura de Archivos Recomendada (React)

```
src/
├── pages/
│   ├── Landing.jsx          (Pantalla inicial)
│   ├── Register.jsx         (Formulario de registro)
│   ├── Survey.jsx           (Encuesta protegida)
│   └── Results.jsx          (Resultados protegidos)
├── components/
│   ├── RegisterForm.jsx
│   ├── SurveyForm.jsx
│   ├── ProtectedRoute.jsx   (Guard de rutas)
│   └── SessionProvider.jsx  (Context/Store)
├── hooks/
│   ├── useAuth.js           (Hook para acceder a sesión)
│   └── useSession.js        (Hook para validar sesión)
├── services/
│   ├── api.js               (Cliente HTTP)
│   ├── companyService.js    (Funciones de empresa)
│   └── surveyService.js     (Funciones de encuesta)
├── utils/
│   ├── validators.js        (Validaciones)
│   ├── storage.js           (LocalStorage helpers)
│   └── constants.js         (Constantes)
├── context/
│   └── AuthContext.js       (Contexto de autenticación)
├── styles/
│   └── ...
└── App.jsx                  (Rutas principales)
```

---

## ⚙️ Implementación en React

### App.jsx (Rutas)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Survey from './pages/Survey';
import Results from './pages/Results';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/landing" />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas protegidas */}
          <Route 
            path="/survey" 
            element={<ProtectedRoute><Survey /></ProtectedRoute>} 
          />
          <Route 
            path="/results" 
            element={<ProtectedRoute><Results /></ProtectedRoute>} 
          />
          
          <Route path="*" element={<Navigate to="/landing" />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
```

### ProtectedRoute.jsx (Guard)

```javascript
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/register" state={{ message: "Primero debes registrar tu empresa" }} />;
  }
  
  return children;
}
```

### AuthContext.js (Contexto de Sesión)

```javascript
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inicializar desde localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('session');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (sessionData) => {
    localStorage.setItem('session', JSON.stringify(sessionData));
    setSession(sessionData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('session');
    setSession(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Register.jsx (Formulario de Registro)

```javascript
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { companyService } from '../services/companyService';

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    industria: '',
    tamano: 'medium',
    pais: '',
    nombreUsuario: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await companyService.register(formData);
      
      // Crear sesión
      const sessionData = {
        isAuthenticated: true,
        companyId: response.company.id,
        userId: response.user.id,
        companyName: response.company.name,
        userName: response.user.name,
        email: response.user.email,
        industry: response.company.industry,
        country: response.company.country,
        companySize: response.company.size
      };
      
      // Guardar sesión en contexto
      login(sessionData);
      
      // Redirigir a encuesta
      navigate('/survey');
    } catch (err) {
      setError(err.message || 'Error al registrar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="register-container">
      <h1>Registra tu Empresa</h1>
      <p>Este registro es obligatorio antes de completar la evaluación</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombreEmpresa"
          placeholder="Nombre de la empresa"
          value={formData.nombreEmpresa}
          onChange={handleChange}
          required
        />
        
        <select
          name="industria"
          value={formData.industria}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona industria</option>
          <option value="Technology">Tecnología</option>
          <option value="Finance">Finanzas</option>
          <option value="Retail">Retail</option>
          {/* más opciones */}
        </select>
        
        <select
          name="tamano"
          value={formData.tamano}
          onChange={handleChange}
        >
          <option value="small">Pequeña (1-50 empleados)</option>
          <option value="medium">Mediana (51-250 empleados)</option>
          <option value="large">Grande (251-1000 empleados)</option>
          <option value="enterprise">Empresa (+1000 empleados)</option>
        </select>
        
        <input
          type="text"
          name="pais"
          placeholder="País"
          value={formData.pais}
          onChange={handleChange}
          required
        />
        
        <input
          type="text"
          name="nombreUsuario"
          placeholder="Tu nombre"
          value={formData.nombreUsuario}
          onChange={handleChange}
          required
        />
        
        <input
          type="email"
          name="email"
          placeholder="Tu email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar y Continuar'}
        </button>
      </form>
    </div>
  );
}
```

### Survey.jsx (Encuesta Protegida)

```javascript
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Survey() {
  const { session } = useContext(AuthContext);

  // Aquí tienes acceso a:
  // - session.companyId
  // - session.userId
  // - session.companyName
  // etc.

  useEffect(() => {
    console.log('Encuesta iniciada para:', session.companyName);
    console.log('Company ID:', session.companyId);
    console.log('User ID:', session.userId);
  }, [session]);

  const handleSaveResponse = async (questionId, answer) => {
    try {
      // Guardar respuesta con datos de sesión
      await fetch('/api/survey/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: session.companyId,
          user_id: session.userId,
          question_id: questionId,
          answer: answer
        })
      });
    } catch (err) {
      console.error('Error al guardar respuesta:', err);
    }
  };

  return (
    <div className="survey-container">
      <h1>Evaluación de Madurez de {session.companyName}</h1>
      {/* Componentes de encuesta */}
    </div>
  );
}
```

---

## 🚀 Checklist de Implementación

- [ ] Crear context/AuthContext.js con SessionProvider
- [ ] Crear componente ProtectedRoute.jsx
- [ ] Crear página Landing.jsx
- [ ] Crear formulario Register.jsx
- [ ] Crear página Survey.jsx (protegida)
- [ ] Crear página Results.jsx (protegida)
- [ ] Configurar rutas en App.jsx
- [ ] Crear servicio companyService.js
- [ ] Crear servicio surveyService.js
- [ ] Implementar API backend:
  - [ ] POST /api/companies/register
  - [ ] POST /api/survey/responses
  - [ ] GET /api/survey/results
- [ ] Validar formulario (validators.js)
- [ ] Pruebas de redirección:
  - [ ] Intentar acceder a /survey sin registro → redirecciona a /register
  - [ ] Completar registro → redirecciona a /survey
  - [ ] Cerrar sesión → redirecciona a /landing

---

## 📋 Mensajes Predefinidos

```javascript
const MESSAGES = {
  REGISTER_REQUIRED: "Primero debes registrar tu empresa",
  REGISTER_SUCCESS: "¡Bienvenido! Tu empresa ha sido registrada correctamente",
  REGISTER_ERROR: "Error al registrar la empresa. Intenta nuevamente",
  SURVEY_COMPLETED: "¡Encuesta completada! Consultando resultados...",
  SESSION_EXPIRED: "Tu sesión ha expirado. Por favor, registrate nuevamente"
};
```

---

**Ahora tienes un flujo completo, listo para implementar en React o cualquier framework moderno.** 🎉
