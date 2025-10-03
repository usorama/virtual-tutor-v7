#!/usr/bin/env python3
"""
Comprehensive 'any' Type Parser
Parses all grep results and categorizes each violation
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class AnyTypeParser:
    def __init__(self):
        self.locations = []
        self.metadata = {
            "generatedAt": datetime.now().isoformat(),
            "totalCount": 0,
            "methods": {},
            "breakdown": {
                "explicit": 0,
                "implicit": 0,
                "assertion": 0,
                "generic": 0
            },
            "bySeverity": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "protectedCore": 0,
            "testFiles": 0,
            "productionCode": 0
        }

    def parse_line(self, line: str, source_type: str) -> Dict[str, Any]:
        """Parse a single grep output line"""
        # Format: filepath:line:code
        match = re.match(r'^([^:]+):(\d+):(.+)$', line)
        if not match:
            return None

        filepath, line_num, code = match.groups()

        # Determine category
        category = self._determine_category(code, source_type)

        # Check if in protected core (exclude tests/mocks)
        is_protected_core = (
            'protected-core' in filepath and
            'tests/mocks' not in filepath and
            '.test.ts' not in filepath
        )

        # Check if test file
        is_test = (
            '.test.ts' in filepath or
            '.spec.ts' in filepath or
            'tests/' in filepath or
            '/mocks/' in filepath
        )

        # Determine severity
        severity = self._determine_severity(filepath, is_protected_core, is_test)

        # Suggest type replacement
        suggested_type = self._suggest_type(code, category)

        return {
            "file": filepath,
            "line": int(line_num),
            "code": code.strip(),
            "category": category,
            "protectedCore": is_protected_core,
            "isTest": is_test,
            "severity": severity,
            "suggestedType": suggested_type
        }

    def _determine_category(self, code: str, source_type: str) -> str:
        """Determine the category of 'any' type"""
        if source_type == 'as-any':
            return 'assertion'
        elif 'Record<' in code and 'any' in code:
            return 'generic'
        elif 'Promise<any>' in code:
            return 'generic'
        elif 'Array<any>' in code:
            return 'generic'
        elif '...args: any[]' in code:
            return 'generic'
        elif ': any' in code:
            # Check if it's a function parameter without explicit type (implicit)
            if re.search(r'function.*\([^)]*\bany\b', code):
                return 'implicit'
            return 'explicit'
        else:
            return 'explicit'

    def _determine_severity(self, filepath: str, is_protected_core: bool, is_test: bool) -> str:
        """Determine severity level"""
        if is_protected_core:
            return 'critical'
        elif is_test:
            return 'low'
        elif any(x in filepath for x in ['features/', 'components/', 'app/']):
            return 'high'
        elif any(x in filepath for x in ['lib/', 'utils/', 'hooks/']):
            return 'medium'
        else:
            return 'medium'

    def _suggest_type(self, code: str, category: str) -> str:
        """Suggest a replacement type"""
        # Basic suggestions - can be enhanced
        if 'data:' in code and category == 'explicit':
            return 'unknown (then narrow with type guard)'
        elif 'event' in code.lower():
            return 'Event or specific event type'
        elif 'error' in code.lower():
            return 'Error | unknown'
        elif 'Record<string, any>' in code:
            return 'Record<string, unknown> or specific type'
        elif 'Promise<any>' in code:
            return 'Promise<void> or Promise<SpecificType>'
        elif '...args: any[]' in code:
            return 'Use generic: <T extends unknown[]>'
        elif category == 'assertion':
            return 'Remove type assertion and fix actual type'
        else:
            return 'Specific type based on context'

    def parse_file(self, filepath: str, source_type: str):
        """Parse a grep output file"""
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                parsed = self.parse_line(line, source_type)
                if parsed:
                    self.locations.append(parsed)

    def update_metadata(self):
        """Update metadata counts"""
        self.metadata['totalCount'] = len(self.locations)

        for loc in self.locations:
            # Category breakdown
            self.metadata['breakdown'][loc['category']] += 1

            # Severity breakdown
            self.metadata['bySeverity'][loc['severity']] += 1

            # Protected core count
            if loc['protectedCore']:
                self.metadata['protectedCore'] += 1

            # Test vs production
            if loc['isTest']:
                self.metadata['testFiles'] += 1
            else:
                self.metadata['productionCode'] += 1

    def generate_json(self, output_path: str):
        """Generate JSON manifest"""
        self.update_metadata()

        # Sort locations by severity then filepath
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        self.locations.sort(key=lambda x: (
            severity_order[x['severity']],
            x['file'],
            x['line']
        ))

        output = {
            "metadata": self.metadata,
            "locations": self.locations
        }

        with open(output_path, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"Generated JSON manifest: {output_path}")
        print(f"Total violations: {self.metadata['totalCount']}")
        print(f"Protected core: {self.metadata['protectedCore']}")
        print(f"Production code: {self.metadata['productionCode']}")
        print(f"Test files: {self.metadata['testFiles']}")


def main():
    parser = AnyTypeParser()

    # Parse all grep results
    print("Parsing explicit ': any' occurrences...")
    parser.parse_file('/tmp/explicit-any.txt', 'explicit')

    print("Parsing 'as any' type assertions...")
    parser.parse_file('/tmp/as-any.txt', 'as-any')

    # Generate JSON
    output_path = '/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/docs/investigations/ALL-ANY-TYPE-LOCATIONS.json'
    parser.generate_json(output_path)

    return parser


if __name__ == '__main__':
    main()
