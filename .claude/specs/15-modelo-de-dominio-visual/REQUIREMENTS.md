# 15 — Modelo de dominio visual: relaciones y reglas de negocio

**Estado:** borrador (pendiente de refinar con Alfonso)
**Depende de:** 13-studio-canvas (lienzo de bloques), 14-attachments-component

---

## 1. Problema

Hoy el estudio dibuja **vistas** y **entidades sueltas**. Faltan dos cosas que el
generador y la IA necesitan y que ahora mismo nadie declara:

1. **Las relaciones entre entidades.** El resource-schema YA las soporta
   (`RelationDefinition`, `FieldRelation`, `reference | composition`, con los
   drill-downs derivados de las referencias hijas), pero el lienzo no tiene
   forma de expresarlas: hoy solo se pueden escribir a mano en el `.model.ts`.
2. **Las reglas de negocio de cada entidad.** El generador emite la estructura
   determinista; los huecos `@ai:begin…@ai:end` los rellena la IA **sin más
   contexto que los nombres de los campos**. Una regla como "un contrato no
   puede renovarse si su cliente está de baja" no está escrita en ninguna parte.

## 2. Propuesta a debatir

Dos artefactos nuevos en el estudio, ambos **datos, nunca código**:

- **Diagrama de entidades** (estilo ER, no UML completo): cajas = entidades del
  lienzo, flechas = relaciones tipadas (`reference` / `composition`, 1:N o N:1).
  Editable arrastrando de una caja a otra. Es el ÚNICO sitio donde se declaran
  relaciones, y alimenta directamente `relations` del resource-schema.
- **Reglas de negocio por entidad**: lista de frases en lenguaje natural
  (invariantes, transiciones de estado, validaciones cruzadas) asociadas a la
  entidad. NO se ejecutan: viajan al app-schema como contexto y se inyectan en
  el prompt de la IA cuando rellena los `@ai` y en los comentarios del dominio.

## 3. Límite (que esta spec NO debe cruzar)

- El diagrama es **de datos**, no de clases ni de secuencia: nada de métodos,
  herencia ni cardinalidades exóticas. Sirve para lo que el generador emite hoy.
- Las reglas son **contexto**, no una DSL ejecutable. En cuanto alguien quiera
  "compilar" una regla, estamos en el inner-platform effect (regla 7).
- El layout del diagrama (posiciones x/y de las cajas) es **cosmético**: puede
  guardarse para que el usuario no lo recoloque, pero no entra al app-schema
  ni afecta a la generación (coherente con ADR-009).

## 4. Preguntas abiertas para Alfonso

- ¿Las relaciones deben poder crearse también desde el chat, o solo dibujando?
- ¿Las reglas se escriben a mano, o la IA las propone y tú las editas/apruebas?
- ¿El diagrama es una pestaña aparte del lienzo, o una capa que se superpone?
- ¿Las reglas se emiten además como documentación (`docs/reglas-<entidad>.md`)
  en la app generada, para que sobrevivan al primer `git clone`?

## 5. User stories (EARS) — pendientes

_Se redactan cuando estén cerradas las preguntas del punto 4._
