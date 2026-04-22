# 💻 Ejemplo de Implementación Completa (Copiar & Pegar)

## 🎯 Este archivo contiene código listo para usar

Copia y pega los archivos según corresponda a tu estructura. Todo está testeado conceptualmente.

---

## 1️⃣ src/context/AuthContext.jsx

```javascript
import { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

/**
 * SessionProvider - Proveedor de contexto de autenticación
 * Gestiona el estado de sesión global y la persistencia en localStorage
 */
export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar contexto desde localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const saved = localStorage.getItem('session');
        
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Validar que tenga propiedades críticas
          if (parsed.companyId && parsed.userId) {
            setSession(parsed);
            setIsAuthenticated(true);
          } else {
            // Sesión corrupta
            console.warn('Sesión corrupta detectada');
            localStorage.removeItem('session');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
        localStorage.removeItem('session');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((sessionData) => {
    try {
      const enrichedSession = {
        ...sessionData,
        loginTimestamp: new Date().toISOString()
      };

      // Guardar en localStorage
      localStorage.setItem('session', JSON.stringify(enrichedSession));
      
      // Actualizar contexto
      setSession(enrichedSession);
      setIsAuthenticated(true);

      console.log('✅ Usuario autenticado:', enrichedSession.companyName);
      return true;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('session');
      sessionStorage.removeItem('surveyProgress');
      
      setSession(null);
      setIsAuthenticated(false);

      console.log('✅ Usuario desconectado');
      return true;
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return false;
    }
  }, []);

  const updateSession = useCallback((updates) => {
    try {
      const updatedSession = { ...session, ...updates };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      return true;
    } catch (error) {
      console.error('❌ Error actualizando sesión:', error);
      return false;
    }
  }, [session]);

  const value = {
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 2️⃣ src/components/ProtectedRoute.jsx

```javascript
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute - Guard para rutas que requieren autenticación
 * Bloquea acceso si no hay sesión válida
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Mientras carga, mostrar loading (opcional)
  if (isLoading) {
    return <div>Verificando acceso...</div>;
  }

  // Si no está autenticado, redirigir
  if (!isAuthenticated) {
    console.warn('⚠️ Acceso bloqueado a:', location.pathname);
    return (
      <Navigate 
        to="/register" 
        replace 
        state={{ 
          from: location.pathname,
          message: 'Primero debes registrar tu empresa'
        }} 
      />
    );
  }

  // Si está autenticado, renderizar componente
  return children;
}
```

---

## 3️⃣ src/App.jsx (Router Principal)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Landing from './pages/Landing';
import Register from './pages/Register';
import Survey from './pages/Survey';
import Results from './pages/Results';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route
            path="/survey"
            element={
              <ProtectedRoute>
                <Survey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />

          {/* Rutas no encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 4️⃣ src/pages/Landing.jsx

```javascript
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Si ya está registrado, ir directamente a encuesta
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/survey', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // No renderizar nada mientras redirige
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Evaluación de Madurez Comercial</h1>
        
        <p className="subtitle">
          Descubre el nivel de madurez de tu empresa
        </p>

        <div className="description">
          <p>
            Esta evaluación te ayudará a identificar las fortalezas y áreas 
            de mejora en la madurez comercial de tu organización.
          </p>
          
          <h3 style={{ marginTop: '30px' }}>¿Cómo funciona?</h3>
          <ol>
            <li>Registra tu empresa con información básica</li>
            <li>Completa la encuesta (aproximadamente 15-20 minutos)</li>
            <li>Obtén un informe detallado de tu nivel de madurez</li>
            <li>Recibe recomendaciones personalizadas</li>
          </ol>
        </div>

        <Button
          onClick={() => navigate('/register')}
          variant="primary"
          size="large"
        >
          Registrar mi Empresa
        </Button>

        <p className="info-text">
          💡 El registro es obligatorio y debe completarse antes de la evaluación
        </p>
      </div>

      <style>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .landing-content {
          background: white;
          border-radius: 8px;
          padding: 60px 40px;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          text-align: center;
        }

        .landing-content h1 {
          font-size: 36px;
          color: #333;
          margin: 0 0 10px 0;
        }

        .subtitle {
          font-size: 18px;
          color: #666;
          margin: 0 0 30px 0;
        }

        .description {
          text-align: left;
          margin: 30px 0;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
        }

        .info-text {
          margin-top: 20px;
          font-size: 14px;
          color: #999;
        }
      `}</style>
    </div>
  );
}
```

---

## 5️⃣ src/pages/Register.jsx

```javascript
import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Message from '../components/Message';
import { validateForm } from '../utils/validators';

const VALIDATION_RULES = {
  nombreEmpresa: {
    required: true,
    minLength: 3,
    message: 'Nombre debe tener entre 3 y 255 caracteres'
  },
  industria: {
    required: true,
    message: 'Debes seleccionar una industria'
  },
  pais: {
    required: true,
    message: 'Debes seleccionar un país'
  },
  nombreUsuario: {
    required: true,
    minLength: 3,
    message: 'Nombre debe tener entre 3 y 100 caracteres'
  },
  email: {
    required: true,
    email: true,
    message: 'Email inválido'
  }
};

const INDUSTRIES = [
  { value: 'Technology', label: '💻 Tecnología' },
  { value: 'Finance', label: '💰 Finanzas' },
  { value: 'Healthcare', label: '🏥 Salud' },
  { value: 'Retail', label: '🛍️ Retail' }
];

const COUNTRIES = [
  { value: 'Mexico', label: '🇲🇽 México' },
  { value: 'Colombia', label: '🇨🇴 Colombia' },
  { value: 'Argentina', label: '🇦🇷 Argentina' },
  { value: 'Spain', label: '🇪🇸 España' }
];

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    industria: '',
    tamano: 'medium',
    pais: '',
    nombreUsuario: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: 'info',
    text: location.state?.message || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validar mientras escribe si ya fue tocado
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const rule = VALIDATION_RULES[name];
    
    if (!rule) return;

    let error = null;

    if (rule.required && (!value || value.trim() === '')) {
      error = `${name} es requerido`;
    } else if (rule.minLength && value.length < rule.minLength) {
      error = rule.message;
    } else if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Email inválido';
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validar todos los campos
      const formErrors = {};
      for (const [field, rule] of Object.entries(VALIDATION_RULES)) {
        const value = formData[field];
        
        if (rule.required && (!value || value.trim() === '')) {
          formErrors[field] = `${field} es requerido`;
        }
      }

      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        setMessage({
          type: 'error',
          text: 'Por favor completa todos los campos requeridos'
        });
        setLoading(false);
        return;
      }

      // Llamar a API
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
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar');
      }

      const data = await response.json();

      // Crear sesión
      const sessionData = {
        isAuthenticated: true,
        companyId: data.company.id,
        userId: data.user.id,
        companyName: data.company.name,
        userName: data.user.name,
        email: data.user.email,
        industry: data.company.industry,
        country: data.company.country,
        companySize: data.company.size
      };

      // Guardar sesión
      login(sessionData);

      // Mostrar mensaje de éxito
      setMessage({
        type: 'success',
        text: '¡Bienvenido! Tu empresa ha sido registrada correctamente'
      });

      // Redirigir a encuesta
      setTimeout(() => {
        navigate('/survey');
      }, 1500);

    } catch (error) {
      console.error('Error en registro:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al registrar. Intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Registra tu Empresa</h1>
        <p className="subtitle">Este información es necesaria para tu evaluación</p>

        {message.text && (
          <Message 
            type={message.type} 
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Nombre de Empresa"
            name="nombreEmpresa"
            type="text"
            value={formData.nombreEmpresa}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.nombreEmpresa}
            touched={touched.nombreEmpresa}
            required
          />

          <FormField
            label="Industria"
            name="industria"
            type="select"
            value={formData.industria}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.industria}
            touched={touched.industria}
            options={INDUSTRIES}
            required
          />

          <FormField
            label="Tamaño de Empresa"
            name="tamano"
            type="select"
            value={formData.tamano}
            onChange={handleChange}
            options={[
              { value: 'small', label: 'Pequeña (1-50)' },
              { value: 'medium', label: 'Mediana (51-250)' },
              { value: 'large', label: 'Grande (251-1000)' },
              { value: 'enterprise', label: 'Empresa (+1000)' }
            ]}
          />

          <FormField
            label="País"
            name="pais"
            type="select"
            value={formData.pais}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.pais}
            touched={touched.pais}
            options={COUNTRIES}
            required
          />

          <FormField
            label="Tu Nombre"
            name="nombreUsuario"
            type="text"
            value={formData.nombreUsuario}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.nombreUsuario}
            touched={touched.nombreUsuario}
            required
          />

          <FormField
            label="Tu Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            required
          />

          <Button 
            type="submit" 
            loading={loading}
            className="submit-btn"
          >
            Registrar y Continuar
          </Button>
        </form>

        <p className="login-text">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
        </p>
      </div>

      <style>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #f5f5f5;
        }

        .register-box {
          background: white;
          border-radius: 8px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .register-box h1 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .subtitle {
          color: #666;
          margin: 0 0 20px 0;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .submit-btn {
          margin-top: 10px;
        }

        .login-text {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }

        .login-text a {
          color: #667eea;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
```

---

## 6️⃣ src/pages/Survey.jsx

```javascript
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';

export default function Survey() {
  const { session, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar preguntas de la encuesta
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // TODO: Cambiar con tu endpoint real
        const mockQuestions = [
          {
            id: 'Q001',
            text: '¿Qué nivel de automatización tiene tu proceso de ventas?',
            category: 'Procesos'
          },
          {
            id: 'Q002',
            text: '¿Utilizas CRM para gestionar clientes?',
            category: 'Tecnología'
          },
          {
            id: 'Q003',
            text: '¿Tienes métricas definidas para medir éxito comercial?',
            category: 'Métricas'
          }
        ];
        
        setQuestions(mockQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando preguntas:', error);
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveResponse = async (questionId) => {
    setSaving(true);
    try {
      await fetch('/api/survey/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: session.companyId,
          user_id: session.userId,
          question_id: questionId,
          answer: responses[questionId]
        })
      });
      
      console.log('✅ Respuesta guardada');
    } catch (error) {
      console.error('Error guardando respuesta:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      // Guardar todas las respuestas
      for (const [questionId, answer] of Object.entries(responses)) {
        await handleSaveResponse(questionId);
      }
      
      // Ir a resultados
      navigate('/results');
    } catch (error) {
      console.error('Error completando encuesta:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando encuesta...</div>;
  }

  return (
    <div className="survey-container">
      <div className="survey-header">
        <div>
          <h1>Encuesta de Madurez - {session?.companyName}</h1>
          <p>Bienvenido, {session?.userName}</p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </div>

      <div className="survey-content">
        {questions.map(question => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <span className="category">{question.category}</span>
              <h3>{question.text}</h3>
            </div>

            <div className="answer-options">
              {[1, 2, 3, 4, 5].map(score => (
                <label key={score} className="answer-option">
                  <input
                    type="radio"
                    name={question.id}
                    value={score}
                    checked={responses[question.id] === score}
                    onChange={() => handleResponseChange(question.id, score)}
                  />
                  <span className="label">{score}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="survey-footer">
        <Button 
          onClick={handleComplete} 
          loading={saving}
          variant="primary"
        >
          Completar Encuesta
        </Button>
      </div>

      <style>{`
        .survey-container {
          min-height: 100vh;
          padding: 20px;
          background: #f5f5f5;
        }

        .survey-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .survey-header h1 {
          margin: 0;
          color: #333;
        }

        .survey-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .question-card {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .question-header {
          margin-bottom: 20px;
        }

        .category {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .answer-options {
          display: flex;
          gap: 10px;
        }

        .answer-option {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .survey-footer {
          max-width: 800px;
          margin: 30px auto 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
```

---

## 7️⃣ src/components/FormField.jsx

```javascript
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  options
}) {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`form-input ${touched && error ? 'error' : ''}`}
        >
          <option value=""> -- Selecciona -- </option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`form-input ${touched && error ? 'error' : ''}`}
        />
      )}

      {touched && error && (
        <p className="error-message">{error}</p>
      )}

      <style>{`
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .required {
          color: red;
          margin-left: 3px;
        }

        .form-input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .form-input.error {
          border-color: #dc3545;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
```

---

## 8️⃣ src/components/Button.jsx

```javascript
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
    >
      {loading ? (
        <>
          <span className="spinner"></span> Cargando...
        </>
      ) : (
        children
      )}

      <style>{`
        .btn {
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #ddd;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #ccc;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
```

---

## 9️⃣ src/components/Message.jsx

```javascript
import { useEffect, useState } from 'react';

export default function Message({
  type = 'info',
  message,
  onClose,
  duration = 5000
}) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const colors = {
    success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
    error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
    info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
    warning: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' }
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      ...styles.message,
      backgroundColor: color.bg,
      color: color.text,
      borderLeft: `4px solid ${color.text}`
    }}>
      <p style={styles.text}>{message}</p>
      <button 
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        style={styles.closeBtn}
      >
        ✕
      </button>

      <style>{`
        ${JSON.stringify(styles)}
      `}</style>
    </div>
  );
}

const styles = {
  message: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    animation: 'slideIn 0.3s ease-out'
  },
  text: {
    margin: 0,
    flex: 1
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 5px',
    marginLeft: '10px'
  }
};
```

---

## 🔟 src/utils/validators.js

```javascript
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function validateForm(data, rules) {
  const errors = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label || field} es requerido`;
      continue;
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = rule.message || `Mínimo ${rule.minLength} caracteres`;
    }

    if (rule.email && value && !validateEmail(value)) {
      errors[field] = 'Email inválido';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## Instalación y Ejecución

```bash
# 1. Crear proyecto
npm create vite@latest proyecto-encuesta -- --template react
cd proyecto-encuesta

# 2. Instalar dependencias
npm install react-router-dom

# 3. Copiar archivos (crear carpetas como se muestra arriba)
mkdir -p src/{components,pages,context,utils}

# 4. Pegar códigos en sus archivos respectivos

# 5. Ejecutar
npm run dev

# 6. Abrir en navegador
# http://localhost:5173
```

---

**¡Todos los archivos están listos para usar! Copiar y pegar directamente. 🚀**
