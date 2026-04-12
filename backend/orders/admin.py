from django.contrib import admin
from .models import Customer, Order, ReportTask


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'company', 'created_at')
    search_fields = ('name', 'email', 'company')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'customer', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'customer__name', 'customer__email')


@admin.register(ReportTask)
class ReportTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'progress', 'created_at', 'updated_at')
    list_filter = ('status',)
