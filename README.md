# Notification Generator

A generation of Event Notifications

## Installation

```
yarn install
```

## Run

```
yarn run clean
yarn run all
```

## Scenario

To add a scenario, create a YAML file in the scenarios directory. Each YAML scenario may contain the following fields:

- `$` : zero or more subdirectories where to store the serialized notification (optional)
- `@context` : optional JSON-LD context
- `id` : activity identifier
- `type` : activity types
- `actor` : identifier of an actor defined in config/agents
- `origin` : identifier of an origin defined in config/agents
- `context` : identifier of a context object defined in config/objects
- `inReplyTo` : identifier of a notification
- `object` : identifier of an object defined in config/objects
- `target` : identifier of a target defined in config/agents