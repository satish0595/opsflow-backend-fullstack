from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from orders.models import Customer, Order


class Command(BaseCommand):
    help = 'Seed demo data for OpsFlow'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        if Customer.objects.exists():
            self.stdout.write(self.style.WARNING('Seed data already exists, skipping.'))
            return

        customers = [
            Customer.objects.create(name='Alice Martin', email='alice@example.com', company='Acme SAS'),
            Customer.objects.create(name='Bob Singh', email='bob@example.com', company='Nova Tech'),
            Customer.objects.create(name='Claire Dubois', email='claire@example.com', company='Insight Labs'),
        ]

        orders = [
            ('API Integration Package', 1200.00, Order.Status.PENDING),
            ('Analytics Migration', 3400.00, Order.Status.PROCESSING),
            ('Monthly Support Retainer', 800.00, Order.Status.COMPLETED),
            ('Data Cleanup Job', 500.00, Order.Status.FAILED),
            ('Reporting Automation', 1500.00, Order.Status.COMPLETED),
        ]

        for index, (title, amount, status) in enumerate(orders):
            Order.objects.create(
                customer=customers[index % len(customers)],
                title=title,
                description=f'Demo order for {title}',
                amount=amount,
                status=status,
            )

        self.stdout.write(self.style.SUCCESS('Seeded customers and orders'))
