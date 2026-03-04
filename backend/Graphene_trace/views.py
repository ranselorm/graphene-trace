from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from api.models import TestTable
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
        print("Login attempt:", email, password)
        try:
            user = TestTable.objects.get(email = email)
        except TestTable.DoesNotExist:
            return JsonResponse({"error":"Invalid credentials"}, status =401)

        if user.passwords!= password:
            return JsonResponse({"error":"Invalid credentials"}, status =401)
        return JsonResponse({
            "token": "abc123",
            "user": {
                "id": user.id,
                "email": user.email,
                "value": user.value,
                "role": user.role
            }
        })
        
        return JsonResponse({"error": "Invalid credentials"}, status=401)