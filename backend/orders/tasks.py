import time
from celery import shared_task
from django.db.models import Avg, Count, Sum
from .models import Order, ReportTask


@shared_task(bind=True)
def generate_report(self, report_task_id: int):
    report_task = ReportTask.objects.get(id=report_task_id)
    report_task.status = ReportTask.Status.STARTED
    report_task.progress = 10
    report_task.save(update_fields=['status', 'progress', 'updated_at'])

    for progress in [25, 45, 65, 85]:
        time.sleep(1)
        report_task.progress = progress
        report_task.save(update_fields=['progress', 'updated_at'])

    orders = Order.objects.select_related('customer').all()
    aggregates = orders.aggregate(
        total_orders=Count('id'),
        total_revenue=Sum('amount'),
        avg_order_value=Avg('amount'),
    )
    status_breakdown = {
        row['status']: row['count']
        for row in orders.values('status').annotate(count=Count('id')).order_by('status')
    }
    top_customers = list(
        orders.values('customer__name').annotate(total=Sum('amount')).order_by('-total')[:3]
    )

    summary = (
        f"Total orders: {aggregates['total_orders'] or 0}\n"
        f"Total revenue: {aggregates['total_revenue'] or 0}\n"
        f"Average order value: {round(float(aggregates['avg_order_value'] or 0), 2)}\n"
        f"Status breakdown: {status_breakdown}\n"
        f"Top customers: {top_customers}"
    )

    report_task.status = ReportTask.Status.SUCCESS
    report_task.progress = 100
    report_task.summary = summary
    report_task.save(update_fields=['status', 'progress', 'summary', 'updated_at'])
    return summary
