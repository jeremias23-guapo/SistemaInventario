// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext'; // <-- loader global

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false); // spinner de botón

  const { login } = useContext(AuthContext);
  const { start, stop } = useLoading();                // overlay global
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    start(); // muestra overlay global

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      stop();           // oculta overlay
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card elevation={3} sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Iniciar Sesión
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Usuario"
                name="username"
                value={form.username}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                autoFocus
              />

              <TextField
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                disabled={submitting}
                endIcon={
                  submitting ? (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  ) : null
                }
              >
                {submitting ? 'Ingresando...' : 'Entrar'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
