# 15 — Relaciones entre entidades (y, después, el diagrama)

**Estado:** activa · **Sustituye** al borrador de 2026-08-02
**Depende de:** 13-studio-canvas, 16-bloque-ficha (cerradas)

## 1. El problema, dicho con precisión

Las entidades que produce el estudio son **islas**. En la clínica generada, una
cita no sabe de qué paciente es y un paciente no sabe quién es su dueño. Tres
tablas sin relación no son una aplicación; por eso la demo «no se nota» por más
piezas que añadamos al catálogo.

Y el embudo NO es la IA ni el generador, sino el contrato del medio:

- El **resource-schema ya sabe** de relaciones (`FieldRelation`,
  `reference | composition`, `form.lookup` con `denormalizes`) y los módulos de
  oro las usan — `contract.customerId` + `contract.customerName`. Emisión
  probada por el gate.
- El **chat podría** inferirlas: «una cita es de un paciente» es obvio al leer
  la petición.
- Pero `DraftResource` —lo que viaja del chat al lienzo y del lienzo al
  generador— solo admite campos sueltos (texto, número, fecha, booleano). No
  hay forma de decir «esto apunta a aquello».

Cerrar ese tramo es la tarea.

## 2. El canon a reproducir (de contract.model.ts)

Una referencia se expande a DOS campos:

```
customerId:   uuid, required, query.filterable,
              relation: { to: 'customer', kind: 'reference' },
              form: select con lookup { resource, labelField, denormalizes }
customerName: string denormalizado, table.show con label 'Cliente',
              query filterable + sortable + searchable
```

El id gobierna la integridad; el nombre denormalizado es lo que el usuario ve y
por lo que busca. El generador ya emite ambos correctamente.

## 3. Fases (cada una entrega valor visible)

**Fase 1 — el contrato admite relaciones.**
`DraftField` acepta `type: 'ref'` con `refTo: '<entidad>'`. `draftToResource`
lo expande al par canónico. El chat las declara desde el primer momento; a mano
se elige en el editor de columna del lienzo (tipo «referencia a → entidad»),
sin diagrama todavía.

**Fase 2 — se nota en la app generada.**
Formulario de cita con selector de paciente, columna «Paciente» en su listado,
FK real en la migración. Verificado en el navegador, no solo en tests.

**Fase 3 — la ficha se llena.**
En la ficha de Luna, la tabla de sus citas: el drill-down derivado de las
referencias hijas que el canon ya declara (decisión 3 del resource-schema).
Este es el momento en que deja de parecer tres hojas de cálculo.

**Fase 4 — el diagrama.**
Vista de entidades con flechas, editable arrastrando de una caja a otra, como
alternativa visual a declararlas campo a campo. Y las reglas de negocio como
contexto para los huecos `@ai` (árbol de decisión + frases), que se aborda en
su propia spec cuando esto funcione.

## 4. Límites

- Solo `reference` en fase 1–3. `composition` (entidad hija que vive dentro del
  padre) es otro canon y otra spec.
- Nada de relaciones N:M: el schema no las emite hoy y forzarlas sería
  inner-platform (regla 7).
- El layout del diagrama (fase 4) es cosmético: no entra al app-schema.

## 5. User stories (EARS)

- CUANDO el chat describe «una cita es de un paciente», EL diseño DEBE incluir
  un campo de referencia de cita a paciente.
- CUANDO una entidad declara una referencia, EL resource-schema expandido DEBE
  contener el par id + nombre denormalizado con su lookup.
- CUANDO se genera la app, EL formulario DEBE ofrecer un selector con los
  registros de la entidad referenciada y el listado mostrar su nombre.
- CUANDO se borra la entidad referenciada, EL diseño NO DEBE quedar con
  referencias rotas (el gate lo rechaza).

## 6. Gate

Golden diff vacío + app generada donde se crea una cita eligiendo paciente de
un desplegable y el listado muestra su nombre.
