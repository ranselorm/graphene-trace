import os
import csv

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

from datainput.models import UploadSession, ImageFrame, AnalysisResult
from datainput.analysis import analyse_frame


User = get_user_model()


class Command(BaseCommand):
    help = "Import one 32x32 pressure-map CSV file for a given user"

    def add_arguments(self, parser):
        parser.add_argument("user_id", type=int)
        parser.add_argument("path", type=str)

    def handle(self, *args, **kwargs):
        user = User.objects.get(id=kwargs["user_id"])
        file_path = kwargs["path"]

        self.stdout.write(f"Processing {file_path}...")
        frames = self.process_file(user, file_path)

        self.stdout.write(self.style.SUCCESS(f"Imported {frames} frames"))

    def process_file(self, user, file_path):
        # One uploaded file = one session
        session = UploadSession.objects.create(
            user=user,
            file_name=os.path.basename(file_path),
            processed=False,
        )

        row_buffer = []
        frame_index = 0

        with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
            reader = csv.reader(csvfile)

            for row in reader:
                numeric_row = [float(x) for x in row]
                row_buffer.append(numeric_row)

                # Every 32 rows makes one 32x32 frame
                if len(row_buffer) == 32:
                    flattened = [pixel for r in row_buffer for pixel in r]

                    frame = ImageFrame.objects.create(
                        session=session,
                        frame_index=frame_index,
                        pixels=flattened,
                    )

                    metrics = analyse_frame(flattened)

                    AnalysisResult.objects.create(
                        session=session,
                        frame=frame,
                        peak_pressure_index=metrics["peak_pressure_index"],
                        contact_area_percent=metrics["contact_area_percent"],
                        has_high_pressure=metrics["has_high_pressure"],
                        flagged_for_review=metrics["flagged_for_review"],
                    )

                    row_buffer = []
                    frame_index += 1

        session.processed = True
        session.save(update_fields=["processed"])

        return frame_index