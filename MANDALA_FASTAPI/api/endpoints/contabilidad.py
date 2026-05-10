from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from db import models
from schemas import schemas
from api import deps
from datetime import datetime

router = APIRouter()

@router.get("/turno/actual/", response_model=schemas.Turno)
def get_turno_actual(db: Session = Depends(deps.get_db)):
    turno = db.query(models.Turno).filter(models.Turno.estado == "abierto").first()
    if not turno:
        raise HTTPException(status_code=404, detail="No hay un turno abierto actualmente")
    
    # Calcular ventas totales actuales de pedidos que no estén cancelados
    # Asumiendo que el estado 'Cancelado' existe
    ventas = db.query(models.Pedido).filter(
        models.Pedido.turno_id == turno.id
    ).all()
    
    # Filtrar cancelados por nombre si no sabemos el ID
    total = 0
    for p in ventas:
        est = db.query(models.EstadoPedido).filter(models.EstadoPedido.id == p.estado).first()
        if est and est.nombre.lower() != "cancelado":
            total += p.total
            
    turno.total_ventas = total
    
    # Agregar nombres de usuarios
    turno.usuario_apertura_nombre = db.query(models.Usuario.nombre_completo).filter(models.Usuario.id == turno.abierto_por).scalar() or "Admin"
    if turno.cerrado_por:
        turno.usuario_cierre_nombre = db.query(models.Usuario.nombre_completo).filter(models.Usuario.id == turno.cerrado_por).scalar() or "Admin"
    
    return turno

@router.post("/turno/abrir/", response_model=schemas.Turno)
def abrir_turno(
    turno_in: schemas.TurnoCreate, 
    db: Session = Depends(deps.get_db),
    current_user: models.Usuario = Depends(deps.get_current_active_user)
):
    # Verificar si ya hay uno abierto
    existe = db.query(models.Turno).filter(models.Turno.estado == "abierto").first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un turno abierto")
    
    nuevo_turno = models.Turno(
        abierto_por=current_user.id,
        base_inicial=turno_in.base_inicial,
        observaciones=turno_in.observaciones,
        estado="abierto"
    )
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    return nuevo_turno

@router.post("/turno/cerrar/", response_model=schemas.Turno)
def cerrar_turno(
    cierre: schemas.TurnoCierre,
    db: Session = Depends(deps.get_db),
    current_user: models.Usuario = Depends(deps.get_current_active_user)
):
    turno = db.query(models.Turno).filter(models.Turno.estado == "abierto").first()
    if not turno:
        raise HTTPException(status_code=404, detail="No hay un turno abierto para cerrar")
    
    # Calcular ventas finales
    ventas = db.query(models.Pedido).filter(models.Pedido.turno_id == turno.id).all()
    total = 0
    for p in ventas:
        est = db.query(models.EstadoPedido).filter(models.EstadoPedido.id == p.estado).first()
        if est and est.nombre.lower() != "cancelado":
            total += p.total
            
    turno.total_ventas = total
    turno.cerrado_por = current_user.id
    turno.fecha_cierre = datetime.now()
    turno.efectivo_real = cierre.efectivo_real
    turno.estado = "cerrado"
    
    if cierre.observaciones:
        turno.observaciones = (turno.observaciones or "") + "\n[CIERRE]: " + cierre.observaciones
    
    db.commit()
    db.refresh(turno)
    return turno

@router.get("/turnos/historial/", response_model=List[schemas.Turno])
def get_historial_turnos(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(deps.get_db),
    current_user: models.Usuario = Depends(deps.check_admin_role)
):
    turnos = db.query(models.Turno).order_by(models.Turno.fecha_apertura.desc()).offset(skip).limit(limit).all()
    for t in turnos:
        t.usuario_apertura_nombre = db.query(models.Usuario.nombre_completo).filter(models.Usuario.id == t.abierto_por).scalar()
        if t.cerrado_por:
            t.usuario_cierre_nombre = db.query(models.Usuario.nombre_completo).filter(models.Usuario.id == t.cerrado_por).scalar()
    return turnos
