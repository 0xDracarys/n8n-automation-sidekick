# 🎯 Complete Workflow Templates

## 📧 Email Automation Templates

### Template 1: Welcome Email Series
```json
{
  "name": "Welcome Email Series",
  "nodes": [
    {
      "id": "1",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "user-signup",
        "options": {}
      }
    },
    {
      "id": "2",
      "name": "Extract User Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [460, 300],
      "parameters": {
        "values": {
          "string": [
            {
              "name": "userName",
              "value": "={{ $json.body.name }}"
            },
            {
              "name": "userEmail",
              "value": "={{ $json.body.email }}"
            }
          ]
        }
      }
    },
    {
      "id": "3",
      "name": "Send Welcome Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [680, 300],
      "parameters": {
        "to": "={{ $json.userEmail }}",
        "subject": "Welcome to our platform!",
        "body": "Hi {{ $json.userName }},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team"
      }
    }
  ],
  "connections": {
    "1": {
      "main": [
        [
          {
            "node": "2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2": {
      "main": [
        [
          {
            "node": "3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

### Template 2: Customer Support Auto-Reply
```json
{
  "name": "Customer Support Auto-Reply",
  "nodes": [
    {
      "id": "1",
      "name": "Email Trigger",
      "type": "n8n-nodes-base.emailReadImap",
      "typeVersion": 1,
      "position": [240, 300],
      "parameters": {
        "host": "imap.gmail.com",
        "port": 993,
        "secure": true,
        "user": "support@company.com",
        "password": "app_password",
        "folder": "INBOX",
        "markAsRead": true
      }
    },
    {
      "id": "2",
      "name": "Check Keywords",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": false,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "urgent",
              "leftValue": "={{ $json.subject }}",
              "rightValue": "urgent",
              "operator": {
                "type": "string",
                "operation": "contains"
              }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "3",
      "name": "Urgent Response",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [680, 200],
      "parameters": {
        "to": "manager@company.com",
        "subject": "URGENT: {{ $json.subject }}",
        "body": "An urgent customer inquiry has been received:\n\nFrom: {{ $json.from }}\nSubject: {{ $json.subject }}\n\nPlease respond immediately."
      }
    },
    {
      "id": "4",
      "name": "Standard Response",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [680, 400],
      "parameters": {
        "to": "{{ $json.from }}",
        "subject": "Re: {{ $json.subject }}",
        "body": "Thank you for contacting us. We've received your message and will respond within 24 hours.\n\nBest regards,\nCustomer Support Team"
      }
    }
  ],
  "connections": {
    "1": {
      "main": [
        [
          {
            "node": "2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2": {
      "main": [
        [
          {
            "node": "3",
            "type": "main",
            "index": 0
          },
          {
            "node": "4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

## 🔄 Data Processing Templates

### Template 3: CSV Data Processing
```json
{
  "name": "CSV Data Processing Pipeline",
  "nodes": [
    {
      "id": "1",
      "name": "File Upload Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "upload-csv",
        "options": {}
      }
    },
    {
      "id": "2",
      "name": "Parse CSV",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "jsCode": "const csvData = $json.body.csv;\nconst rows = csvData.split('\\n').map(row => row.split(','));\nconst headers = rows[0];\nconst data = rows.slice(1).map(row => {\n  const obj = {};\n  headers.forEach((header, index) => {\n    obj[header] = row[index];\n  });\n  return obj;\n});\nreturn { data };"
      }
    },
    {
      "id": "3",
      "name": "Validate Data",
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2,
      "position": [680, 300],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "valid-email",
              "leftValue": "={{ $json.email }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "4",
      "name": "Save to Database",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [900, 300],
      "parameters": {
        "operation": "insert",
        "database": "production",
        "table": "users",
        "columns": {
          "name": "={{ $json.name }}",
          "email": "={{ $json.email }}",
          "phone": "={{ $json.phone }}"
        }
      }
    }
  ],
  "connections": {
    "1": {
      "main": [
        [
          {
            "node": "2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2": {
      "main": [
        [
          {
            "node": "3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3": {
      "main": [
        [
          {
            "node": "4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

## 📱 API Integration Templates

### Template 4: Slack Bot Integration
```json
{
  "name": "Slack Bot Integration",
  "nodes": [
    {
      "id": "1",
      "name": "Slack Trigger",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "channel": "#general",
        "trigger": "message",
        "event": "message"
      }
    },
    {
      "id": "2",
      "name": "Process Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "jsCode": "const message = $json.text;\nconst isCommand = message.startsWith('/');\nconst command = isCommand ? message.substring(1) : '';\nreturn { message, isCommand, command };"
      }
    },
    {
      "id": "3",
      "name": "Check Command",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": false,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "is-command",
              "leftValue": "={{ $json.isCommand }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equal"
              }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "4",
      "name": "Execute Command",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [900, 200],
      "parameters": {
        "method": "POST",
        "url": "https://api.example.com/execute",
        "body": {
          "command": "={{ $json.command }}",
          "user": "={{ $json.user }}"
        }
      }
    },
    {
      "id": "5",
      "name": "Send Response",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [1120, 200],
      "parameters": {
        "channel": "#general",
        "text": "Command executed: {{ $json.command }}\nResult: {{ $json.result }}"
      }
    },
    {
      "id": "6",
      "name": "Ignore Message",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [900, 400]
    }
  ],
  "connections": {
    "1": {
      "main": [
        [
          {
            "node": "2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2": {
      "main": [
        [
          {
            "node": "3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3": {
      "main": [
        [
          {
            "node": "4",
            "type": "main",
            "index": 0
          },
          {
            "node": "6",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "4": {
      "main": [
        [
          {
            "node": "5",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

## 📊 E-commerce Templates

### Template 5: Order Processing
```json
{
  "name": "E-commerce Order Processing",
  "nodes": [
    {
      "id": "1",
      "name": "Order Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "new-order",
        "options": {}
      }
    },
    {
      "id": "2",
      "name": "Validate Order",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "jsCode": "const order = $json.body;\nconst isValid = order.items && order.items.length > 0 && order.customer && order.total > 0;\nif (!isValid) {\n  throw new Error('Invalid order data');\n}\nreturn { order, isValid };"
      }
    },
    {
      "id": "3",
      "name": "Check Inventory",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [680, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.inventory.com/check",
        "body": {
          "items": "={{ $json.order.items }}"
        }
      }
    },
    {
      "id": "4",
      "name": "Process Payment",
      "type": "n8n-nodes-base.stripe",
      "typeVersion": 1,
      "position": [900, 300],
      "parameters": {
        "operation": "charge",
        "amount": "={{ $json.order.total * 100 }}",
        "currency": "usd",
        "source": "={{ $json.order.paymentToken }}"
      }
    },
    {
      "id": "5",
      "name": "Update Inventory",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1120, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.inventory.com/update",
        "body": {
          "items": "={{ $json.order.items }}",
          "action": "subtract"
        }
      }
    },
    {
      "id": "6",
      "name": "Send Confirmation",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [1340, 300],
      "parameters": {
        "to": "{{ $json.order.customer.email }}",
        "subject": "Order Confirmation #{{ $json.order.id }}",
        "body": "Thank you for your order! Your order #{{ $json.order.id }} has been confirmed and will be shipped soon."
      }
    },
    {
      "id": "7",
      "name": "Notify Warehouse",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [1340, 450],
      "parameters": {
        "channel": "#warehouse",
        "text": "New order #{{ $json.order.id }} ready for fulfillment. Items: {{ $json.order.items.length }}"
      }
    }
  ],
  "connections": {
    "1": {
      "main": [
        [
          {
            "node": "2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2": {
      "main": [
        [
          {
            "node": "3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3": {
      "main": [
        [
          {
            "node": "4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "4": {
      "main": [
        [
          {
            "node": "5",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "5": {
      "main": [
        [
          {
            "node": "6",
            "type": "main",
            "index": 0
          },
          {
            "node": "7",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

## 🎯 How to Use These Templates

1. **Copy the JSON** for any template
2. **Import to n8n** using the import function
3. **Configure credentials** (email, database, API keys)
4. **Test the workflow** before deploying
5. **Customize as needed** for your specific use case

## 📝 Template Categories

- **Email Automation**: Welcome series, auto-responders, newsletters
- **Data Processing**: CSV parsing, data validation, database operations
- **API Integration**: Slack bots, webhooks, third-party services
- **E-commerce**: Order processing, inventory management, customer notifications
- **Monitoring**: Error handling, logging, alerts

These templates provide a solid foundation for common automation workflows and can be easily customized for specific business needs.
