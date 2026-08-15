"""Thin HTTP adapters for public, customer, and administrator testimonial actions."""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.testimonials.serializers import TestimonialInputSerializer, TestimonialModerationSerializer
from apps.testimonials.services import DuplicateTestimonial, TestimonialNotFound, get_testimonial_service
from core.http import public_cache
from core.permissions import IsAdmin, IsClient


class TestimonialPublicListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        del request
        items = get_testimonial_service().list_approved()
        return public_cache(Response({"items": items, "total": len(items)}))


class TestimonialClientView(APIView):
    permission_classes = [IsClient]

    def get(self, request: Request) -> Response:
        return Response({"item": get_testimonial_service().get_for_client(request.user)})

    def post(self, request: Request) -> Response:
        serializer = TestimonialInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = get_testimonial_service().create_for_client(
                request.user,
                dict(serializer.validated_data),
            )
        except DuplicateTestimonial as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(item, status=status.HTTP_201_CREATED)

    def patch(self, request: Request) -> Response:
        serializer = TestimonialInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = get_testimonial_service().update_for_client(
                request.user,
                dict(serializer.validated_data),
            )
        except TestimonialNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(item)

    def delete(self, request: Request) -> Response:
        try:
            get_testimonial_service().delete_for_client(request.user)
        except TestimonialNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TestimonialAdminListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        del request
        items = get_testimonial_service().list_for_moderation()
        return Response({"items": items, "total": len(items)})


class TestimonialAdminDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request: Request, testimonial_id: int) -> Response:
        serializer = TestimonialModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = get_testimonial_service().moderate(
                testimonial_id,
                request.user,
                dict(serializer.validated_data),
            )
        except TestimonialNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(item)
