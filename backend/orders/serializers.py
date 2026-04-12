from rest_framework import serializers
from .models import Customer, Order, ReportTask


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class ReportTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTask
        fields = '__all__'
