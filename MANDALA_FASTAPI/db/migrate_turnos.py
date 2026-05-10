import sqlite3
import os

# Ruta a la base de datos (ajustar según el entorno)
db_path = "mandala_v2.db"

def migrate():
    if not os.path.exists(db_path):
        print(f"Base de datos {db_path} no encontrada.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Verificando tabla 'turnos'...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='turnos'")
    if not cursor.fetchone():
        print("Creando tabla 'turnos' manualmente...")
        cursor.execute("""
            CREATE TABLE turnos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                abierto_por INTEGER REFERENCES usuarios(id),
                cerrado_por INTEGER REFERENCES usuarios(id),
                fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre DATETIME,
                base_inicial NUMERIC(12, 2) DEFAULT 0,
                total_ventas NUMERIC(12, 2) DEFAULT 0,
                efectivo_real NUMERIC(12, 2),
                estado VARCHAR(20) DEFAULT 'abierto',
                observaciones TEXT
            )
        """)
    else:
        print("La tabla 'turnos' ya existe.")

    print("Verificando columna 'turno_id' en la tabla 'pedidos'...")
    cursor.execute("PRAGMA table_info(pedidos)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'turno_id' not in columns:
        print("Añadiendo columna 'turno_id' a 'pedidos'...")
        cursor.execute("ALTER TABLE pedidos ADD COLUMN turno_id INTEGER REFERENCES turnos(id)")
    else:
        print("La columna 'turno_id' ya existe.")

    conn.commit()
    conn.close()
    print("Migración completada con éxito.")

if __name__ == "__main__":
    migrate()
