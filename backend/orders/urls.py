from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    OrderViewSet,
    api_root,
    dashboard_stats,
    generate_report_view,
    report_task_detail,
    report_task_list,
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', api_root),
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats),
    path('reports/generate/', generate_report_view),
    path('reports/tasks/', report_task_list),
    path('reports/tasks/<int:pk>/', report_task_detail),
]
