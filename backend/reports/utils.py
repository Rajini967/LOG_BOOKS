"""
Utility functions for creating reports when entries are approved
"""
from .models import Report
from django.conf import settings


def create_report_entry(
    report_type: str,
    source_id: str,
    source_table: str,
    title: str,
    site: str,
    created_by: str,
    created_at,
    approved_by=None,
    remarks: str = None
):
    """
    Create a Report entry when an item is approved.
    
    Args:
        report_type: Type of report (e.g., 'utility', 'air_velocity', etc.)
        source_id: UUID of the original entry
        source_table: Name of the source table
        title: Report title
        site: Site identifier
        created_by: Name/email of creator
        created_at: Original creation datetime
        approved_by: User who approved (optional)
        remarks: Approval remarks (optional)
    """
    try:
        report = Report.objects.create(
            report_type=report_type,
            source_id=source_id,
            source_table=source_table,
            title=title,
            site=site,
            created_by=created_by,
            created_at=created_at,
            approved_by=approved_by,
            remarks=remarks,
        )
        return report
    except Exception as e:
        # Log error but don't fail the approval process
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating report entry: {e}")
        return None


def delete_report_entry(source_id: str, source_table: str):
    """
    Delete a Report entry when the source entry is deleted.
    
    Args:
        source_id: UUID of the source entry
        source_table: Name of the source table
    """
    try:
        Report.objects.filter(source_id=source_id, source_table=source_table).delete()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting report entry: {e}")

