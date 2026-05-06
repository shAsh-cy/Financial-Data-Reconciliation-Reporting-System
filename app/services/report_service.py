"""Financial report detail read logic (demo-aware)."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import reporting_queries as rq
from app.schemas.reporting import FinancialReportDetailEnvelope
from app.services.detail_payload_builders import build_report_detail_payload
from app.services.reporting_demo import demo_financial_report_by_id
from app.services.reporting_mappers import financial_report_from_orm

logger = logging.getLogger(__name__)


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database unavailable. Ensure PostgreSQL is running, DATABASE_URL is correct, "
            "and migrations are applied (alembic upgrade head)."
        ),
    )


class ReportService:
    """Read-side financial report operations (repository-backed + deterministic demo IDs)."""

    @staticmethod
    async def get_report_detail(
        session: AsyncSession,
        report_id: UUID,
    ) -> FinancialReportDetailEnvelope | None:
        logger.info("ReportService.get_report_detail requested report_id=%s", report_id)
        row = None
        try:
            row = await rq.get_financial_report(session, report_id)
        except OperationalError:
            logger.exception("OperationalError loading financial report id=%s", report_id)
            raise _database_unavailable() from None
        except SQLAlchemyError as exc:
            logger.warning(
                "DB error loading financial report id=%s: %s",
                report_id,
                exc,
                exc_info=True,
            )
            demo = demo_financial_report_by_id(report_id)
            if demo is not None:
                logger.info(
                    "Returning deterministic demo financial report id=%s after DB error",
                    report_id,
                )
                payload = await build_report_detail_payload(session, demo, is_demo=True)
                return FinancialReportDetailEnvelope(
                    id=report_id,
                    data=payload,
                    meta={"is_demo": True},
                )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database query failed while loading financial report.",
            ) from None

        if row is not None:
            try:
                read = financial_report_from_orm(row)
            except Exception:
                logger.exception(
                    "Failed to map FinancialReport ORM to read model id=%s",
                    report_id,
                )
                return None
            logger.info(
                "ReportService.get_report_detail hit_db=true id=%s query_result=found",
                report_id,
            )
            payload = await build_report_detail_payload(session, read, is_demo=False)
            return FinancialReportDetailEnvelope(
                id=report_id,
                data=payload,
                meta={},
            )

        demo = demo_financial_report_by_id(report_id)
        if demo is not None:
            logger.info(
                "ReportService.get_report_detail hit_db=false id=%s query_result=demo_seed",
                report_id,
            )
            payload = await build_report_detail_payload(session, demo, is_demo=True)
            return FinancialReportDetailEnvelope(
                id=report_id,
                data=payload,
                meta={"is_demo": True},
            )

        logger.info(
            "ReportService.get_report_detail hit_db=false id=%s query_result=missing",
            report_id,
        )
        return None
