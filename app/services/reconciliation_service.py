"""Reconciliation detail read logic (demo-aware)."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import reporting_queries as rq
from app.schemas.reporting import (
    ReconciliationItemListResponse,
    ReconciliationItemRead,
    ReconciliationRunDetailEnvelope,
)
from app.services.detail_payload_builders import build_reconciliation_detail_payload
from app.services.reporting_demo import (
    demo_reconciliation_items,
    demo_reconciliation_run_by_id,
)
from app.services.reporting_mappers import (
    reconciliation_item_from_orm,
    reconciliation_run_from_orm,
)

logger = logging.getLogger(__name__)


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database unavailable. Ensure PostgreSQL is running, DATABASE_URL is correct, "
            "and migrations are applied (alembic upgrade head)."
        ),
    )


def _aggregation_payload(counts: dict[str, int]) -> dict[str, object]:
    matched = counts.get("matched", 0)
    only_left = counts.get("only_left", 0)
    only_right = counts.get("only_right", 0)
    return {
        "by_match_type": counts,
        "matched_lines": matched,
        "unmatched_lines": only_left + only_right,
        "only_left": only_left,
        "only_right": only_right,
    }


class ReconciliationService:
    """Read-side reconciliation operations (repository-backed + deterministic demo IDs)."""

    @staticmethod
    async def get_run_detail(
        session: AsyncSession,
        run_id: UUID,
    ) -> ReconciliationRunDetailEnvelope | None:
        logger.info("ReconciliationService.get_run_detail requested run_id=%s", run_id)
        row = None
        try:
            row = await rq.get_reconciliation_run(session, run_id)
        except OperationalError:
            logger.exception("OperationalError loading reconciliation run id=%s", run_id)
            raise _database_unavailable() from None
        except SQLAlchemyError as exc:
            logger.warning(
                "DB error loading reconciliation run id=%s: %s",
                run_id,
                exc,
                exc_info=True,
            )
            demo = demo_reconciliation_run_by_id(run_id)
            if demo is not None:
                logger.info(
                    "Returning deterministic demo reconciliation run id=%s after DB error",
                    run_id,
                )
                payload = await build_reconciliation_detail_payload(
                    session,
                    demo,
                    is_demo=True,
                )
                return ReconciliationRunDetailEnvelope(
                    id=run_id,
                    data=payload,
                    meta={"is_demo": True},
                )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database query failed while loading reconciliation run.",
            ) from None

        if row is not None:
            try:
                read = reconciliation_run_from_orm(row)
            except Exception:
                logger.exception(
                    "Failed to map ReconciliationRun ORM to read model id=%s",
                    run_id,
                )
                return None
            logger.info(
                "ReconciliationService.get_run_detail hit_db=true id=%s query_result=found",
                run_id,
            )
            payload = await build_reconciliation_detail_payload(
                session,
                read,
                is_demo=False,
            )
            return ReconciliationRunDetailEnvelope(id=run_id, data=payload, meta={})

        demo = demo_reconciliation_run_by_id(run_id)
        if demo is not None:
            logger.info(
                "ReconciliationService.get_run_detail hit_db=false id=%s query_result=demo_seed",
                run_id,
            )
            payload = await build_reconciliation_detail_payload(
                session,
                demo,
                is_demo=True,
            )
            return ReconciliationRunDetailEnvelope(
                id=run_id,
                data=payload,
                meta={"is_demo": True},
            )

        logger.info(
            "ReconciliationService.get_run_detail hit_db=false id=%s query_result=missing",
            run_id,
        )
        return None

    @staticmethod
    async def list_items(
        session: AsyncSession,
        *,
        run_id: UUID,
        limit: int,
        offset: int,
    ) -> ReconciliationItemListResponse | None:
        logger.info(
            "ReconciliationService.list_items run_id=%s limit=%s offset=%s",
            run_id,
            limit,
            offset,
        )

        row = None
        try:
            row = await rq.get_reconciliation_run(session, run_id)
        except OperationalError:
            logger.exception(
                "OperationalError resolving reconciliation run for items id=%s",
                run_id,
            )
            raise _database_unavailable() from None
        except SQLAlchemyError as exc:
            logger.warning(
                "DB error resolving run before items id=%s: %s",
                run_id,
                exc,
                exc_info=True,
            )
            row = None

        if row is not None:
            try:
                total = await rq.count_reconciliation_items(session, run_id)
                rows = await rq.list_reconciliation_items(
                    session,
                    run_id=run_id,
                    limit=limit,
                    offset=offset,
                )
                counts = await rq.count_reconciliation_items_by_match_type(session, run_id)
            except OperationalError:
                logger.exception("OperationalError listing reconciliation items id=%s", run_id)
                raise _database_unavailable() from None
            except SQLAlchemyError as exc:
                logger.warning(
                    "DB error listing reconciliation items id=%s: %s",
                    run_id,
                    exc,
                    exc_info=True,
                )
                return ReconciliationItemListResponse(
                    items=[],
                    total=0,
                    meta={"aggregation": _aggregation_payload({})},
                )

            items_out: list[ReconciliationItemRead] = []
            for item_row in rows:
                try:
                    items_out.append(reconciliation_item_from_orm(item_row))
                except Exception:
                    logger.exception(
                        "Skipping unmappable ReconciliationItem id=%s",
                        getattr(item_row, "id", None),
                    )
            agg = _aggregation_payload(counts)
            logger.info(
                "ReconciliationService.list_items DB path id=%s total=%s returned=%s agg=%s",
                run_id,
                total,
                len(items_out),
                agg,
            )
            return ReconciliationItemListResponse(
                items=items_out,
                total=total,
                meta={"aggregation": agg},
            )

        demo = demo_reconciliation_run_by_id(run_id)
        if demo is not None:
            all_items = demo_reconciliation_items(run_id)
            counts: dict[str, int] = {}
            for it in all_items:
                counts[it.match_type] = counts.get(it.match_type, 0) + 1
            total = len(all_items)
            page = all_items[offset : offset + limit]
            agg = _aggregation_payload(counts)
            logger.info(
                "ReconciliationService.list_items demo path id=%s total=%s returned=%s agg=%s",
                run_id,
                total,
                len(page),
                agg,
            )
            return ReconciliationItemListResponse(
                items=page,
                total=total,
                meta={"aggregation": agg, "is_demo": True},
            )

        logger.info("ReconciliationService.list_items run not found id=%s", run_id)
        return None
