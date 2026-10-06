# Admin Store Locations And Branches Module Plan

## Purpose

The Store Locations / Branches module should manage multiple grocery stores or fulfillment branches, service areas, branch capacity, local inventory, riders, staff, delivery radius, and branch performance.

This is important for real grocery operations because order assignment, delivery ETA, available stock, and service areas should depend on the customer's location and the branch serving that location.

## Recommended Tabs

- Overview
- Branches
- Service Areas
- Delivery Radius
- Branch Inventory
- Staff & Riders
- Branch Hours
- Capacity
- Performance
- Settings

## Overview

Metrics:

- Total branches.
- Open branches.
- Closed branches.
- Branch order capacity.
- Branch-level revenue.
- Branch SLA.
- Branch stockout alerts.
- Serviceable areas.
- Assigned riders.
- Branch transfer requests.

## Branch Fields

- Branch ID.
- Branch name.
- Address.
- City.
- Pin code.
- Manager.
- Phone.
- Email.
- Status.
- Operating hours.
- Delivery radius.
- Service areas.
- Order capacity.
- Assigned warehouse/store code.
- Notes.

Branch statuses:

- Open.
- Closed.
- Paused.
- Maintenance.

## Service Area Fields

- Area name.
- Pin code.
- Branch assigned.
- Delivery fee.
- Free delivery threshold.
- ETA range.
- Express delivery availability.
- Status.

## Branch Inventory

Track:

- Product SKU.
- Branch stock.
- Reserved stock.
- Low stock threshold.
- Stockout risk.
- Expiring batches.
- Inter-branch transfer status.

## Actions

- Add branch.
- Edit branch.
- Open/close branch.
- Pause branch.
- Add service area.
- Update delivery radius.
- Assign manager.
- Assign rider.
- Move stock between branches.
- Set branch capacity.
- Set branch hours.
- Export branch report.

## Production Rules

- Orders should be assigned to a branch by customer location.
- Inventory availability should consider branch stock.
- Delivery slots should depend on branch capacity.
- Closing a branch should block new orders for its areas or reroute to another branch.
- Branch stock movement should write to Inventory and Audit Logs.
- Delivery fees and ETA should be service-area aware.

## Recommended First Build Scope

- Sidebar navigation item: `Branches`.
- Route: `/branches`.
- Overview metrics.
- Branch directory.
- Service area manager.
- Delivery radius controls.
- Branch inventory table.
- Staff/rider assignment.
- Branch hours editor.
- Capacity controls.
- Performance table.
