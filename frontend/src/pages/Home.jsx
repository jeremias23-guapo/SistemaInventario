import React from 'react';
import { Container, Typography, Stack, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();
  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Sistema de Inventario
      </Typography>
      <Typography variant="subtitle1" align="center" mb={4}>
        Bienvenido. Elige un módulo para comenzar.
      </Typography>
      <Stack spacing={3} maxWidth="400px" margin="0 auto">
        <Card>
          <CardContent>
            <Typography variant="h5">Productos</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => nav('/productos')}
            >
              Ver Productos
            </Button>
          </CardContent>
        </Card>
        {/* Agrega más cards para otros módulos (Compras, Ventas, Usuarios) */}
      </Stack>
    </Container>
  );
}
