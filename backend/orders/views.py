from django.core.cache import cache
from django.db.models import Count, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Customer, Order, ReportTask
from .serializers import CustomerSerializer, OrderSerializer, ReportTaskSerializer
from .tasks import generate_report

STATS_CACHE_KEY = 'dashboard_stats'


def invalidate_stats_cache():
    cache.delete(STATS_CACHE_KEY)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer').all().order_by('-created_at')
    serializer_class = OrderSerializer

    def perform_create(self, serializer):
        serializer.save()
        invalidate_stats_cache()

    def perform_update(self, serializer):
        serializer.save()
        invalidate_stats_cache()

    def perform_destroy(self, instance):
        instance.delete()
        invalidate_stats_cache()


@api_view(['GET'])
def dashboard_stats(request):
    cached_data = cache.get(STATS_CACHE_KEY)
    if cached_data:
        return Response({**cached_data, 'cached': True})

    total_revenue = Order.objects.aggregate(total=Sum('amount'))['total'] or 0
    orders_per_status = {
        row['status']: row['count']
        for row in Order.objects.values('status').annotate(count=Count('id'))
    }
    data = {
        'total_customers': Customer.objects.count(),
        'total_orders': Order.objects.count(),
        'total_revenue': float(total_revenue),
        'orders_per_status': orders_per_status,
    }
    cache.set(STATS_CACHE_KEY, data, timeout=60)
    return Response({**data, 'cached': False})


@api_view(['POST'])
def generate_report_view(request):
    report_task = ReportTask.objects.create(status=ReportTask.Status.PENDING, progress=0)
    celery_task = generate_report.delay(report_task.id)
    report_task.task_id = celery_task.id
    report_task.save(update_fields=['task_id', 'updated_at'])
    serializer = ReportTaskSerializer(report_task)
    return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
def report_task_list(request):
    tasks = ReportTask.objects.all().order_by('-created_at')
    serializer = ReportTaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def report_task_detail(request, pk):
    task = ReportTask.objects.get(pk=pk)
    serializer = ReportTaskSerializer(task)
    return Response(serializer.data)


@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'OpsFlow API is running',
        'endpoints': {
            'customers': '/api/customers/',
            'orders': '/api/orders/',
            'stats': '/api/dashboard/stats/',
            'generate_report': '/api/reports/generate/',
            'tasks': '/api/reports/tasks/',
        },
    })
