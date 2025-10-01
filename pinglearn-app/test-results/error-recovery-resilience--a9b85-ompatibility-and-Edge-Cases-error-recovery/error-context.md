# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
      - img [ref=e8] [cursor=pointer]
    - generic [ref=e11] [cursor=pointer]:
      - button "Open issues overlay" [ref=e12] [cursor=pointer]:
        - generic [ref=e13] [cursor=pointer]:
          - generic [ref=e14] [cursor=pointer]: "2"
          - generic [ref=e15] [cursor=pointer]: "3"
        - generic [ref=e16] [cursor=pointer]:
          - text: Issue
          - generic [ref=e17] [cursor=pointer]: s
      - button "Collapse issues badge" [ref=e18] [cursor=pointer]:
        - img [ref=e19] [cursor=pointer]
  - generic [ref=e22]:
    - generic [ref=e23]:
      - img [ref=e25]
      - heading "Something Went Wrong" [level=3] [ref=e27]
    - generic [ref=e28]:
      - paragraph [ref=e29]: An unexpected error occurred. Please try refreshing the page.
      - generic [ref=e30]:
        - paragraph [ref=e31]: "Error ID for support:"
        - code [ref=e32]: error-1759314792281-40f3bz9v9
      - generic [ref=e33]:
        - button "Refresh Page" [ref=e34]:
          - img
          - text: Refresh Page
        - button "Go to homepage" [ref=e35]:
          - img
          - text: Go to Homepage
      - group [ref=e36]
  - alert [ref=e38]
```