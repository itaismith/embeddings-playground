import datetime
import uuid

from sqlalchemy import UUID, DateTime, Enum, Table, Column, ForeignKey, String, ARRAY
from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship

from server.schemas import Service

Base = declarative_base()

PlaygroundDocumentAssociation = Table('playground_document_association', Base.metadata,
                                      Column('playground_id', ForeignKey('playground.id'), primary_key=True),
                                      Column('document_id', ForeignKey('document.id'), primary_key=True),
                                      )


class DBPlayground(Base):
    __tablename__ = "playground"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(default="New Playground", nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True),
                                                       default=lambda: datetime.datetime.now(datetime.timezone.utc))
    service: Mapped[Service] = mapped_column(Enum(Service))
    model: Mapped[str] = mapped_column(String)
    documents = relationship("DBDoc", secondary=PlaygroundDocumentAssociation, back_populates="playgrounds")


class DBDoc(Base):
    __tablename__ = "document"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    playgrounds = relationship("DBPlayground", secondary=PlaygroundDocumentAssociation, back_populates="documents")


class DBEmbeddedDoc(Base):
    __tablename__ = "embedded_document"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("document.id"))
    service: Mapped[Service] = mapped_column(Enum(Service))
    model: Mapped[str] = mapped_column(String)


class DBQuery(Base):
    __tablename__ = "query"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    playground_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("playground.id"))
    text: Mapped[Service] = mapped_column(String)
    results: Mapped[list[UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)))
