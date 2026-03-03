# Authentication Setup

## Backend Endpoints Created

### 1. Login
- **URL**: `POST http://localhost:8000/api/auth/login/`
- **Body**:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
- **Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

### 2. Logout
- **URL**: `POST http://localhost:8000/api/auth/logout/`
- **Headers**: Requires authentication (session cookie)
- **Response**:
```json
{
  "message": "Logout successful"
}
```

### 3. Get Current User
- **URL**: `GET http://localhost:8000/api/auth/me/`
- **Headers**: Requires authentication (session cookie)
- **Response**:
```json
{
  "id": 1,
  "email": "admin@example.com",
  "full_name": "Admin User",
  "role": "admin"
}
```

## Create Admin User

Run this command to create an admin user:
```bash
python manage.py shell < create_admin.py
```

Or manually in Django shell:
```bash
python manage.py shell
```
Then:
```python
from accounts.models import User
admin = User.objects.create_user(
    username='admin',
    email='admin@example.com',
    password='admin123',
    full_name='Admin User',
    role='admin',
    is_staff=True,
    is_superuser=True
)
```

## Frontend Integration (React)

### Example Login Component:
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful:', data);
      return data;
    } else {
      console.error('Login failed:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Important Frontend Notes:
- Always include `credentials: 'include'` in fetch requests to send cookies
- The backend will set a session cookie automatically on successful login
- All subsequent requests will use this cookie for authentication
