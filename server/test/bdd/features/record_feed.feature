Feature: Record a baby feeding
  As a parent
  I want to record a feeding amount
  So that I can track intake reliably

  Background:
    Given the API is healthy

  Scenario: Add a valid feeding and see it listed
    When I submit a feeding with quantity "120"
    Then the request is created successfully
    And the recent feeds include a row with quantity "120.00"

  Scenario: Reject an invalid feeding (zero)
    When I submit a feeding with quantity "0"
    Then the request is rejected with a validation error
