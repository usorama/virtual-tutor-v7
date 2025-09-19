Create and run an isolated test for: $ARGUMENTS

Steps to follow:
1. Identify the component/service to test
2. Create a test file if it doesn't exist
3. Write a focused unit test that:
   - Tests the component in isolation
   - Mocks all dependencies
   - Verifies the specific functionality
   - Includes cleanup in afterEach
4. Run the test and report results
5. If test fails, identify the exact issue but DO NOT modify the test to pass

Focus on testing one specific aspect thoroughly rather than broad coverage.
