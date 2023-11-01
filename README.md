# Notification Generator

A generation of Event Notifications

## Installation

```
yarn install
```

## Run

```
# Clean the previous run
yarn run clean
# Generate notifications from scenarios
yarn run all
# In case you want a Solid endpoint to the output
yarn run serve
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

# LDES

Each output directory will contain a `.meta` file and `ldes.jsonld` file to support Event Log experiments