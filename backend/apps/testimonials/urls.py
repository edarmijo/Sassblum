from django.urls import path

from apps.testimonials.views import (
    TestimonialAdminDetailView,
    TestimonialAdminListView,
    TestimonialClientView,
    TestimonialPublicListView,
)

urlpatterns = [
    path("", TestimonialPublicListView.as_view(), name="testimonial-public-list"),
    path("mi-testimonio/", TestimonialClientView.as_view(), name="testimonial-client-detail"),
    path("admin/", TestimonialAdminListView.as_view(), name="testimonial-admin-list"),
    path(
        "admin/<int:testimonial_id>/",
        TestimonialAdminDetailView.as_view(),
        name="testimonial-admin-detail",
    ),
]
