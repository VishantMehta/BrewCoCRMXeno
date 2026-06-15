const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Rules JSON structure:
 * {
 *   "conditions": [
 *     { "field": "total_spend", "operator": ">", "value": 5000 },
 *     { "field": "order_count", "operator": ">=", "value": 2 },
 *     { "field": "last_order_days_ago", "operator": "<", "value": 60 },
 *     { "field": "tags", "operator": "contains", "value": "VIP" }
 *   ],
 *   "logicalOperator": "AND"
 * }
 */

function buildPrismaWhereClause(rulesJson) {
  let rules;
  try {
    rules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;
  } catch (e) {
    return {};
  }

  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return {};
  }

  const prismaConditions = rules.conditions.map(cond => {
    const { field, operator, value } = cond;
    
    if (field === 'last_order_days_ago') {
      const dateTarget = new Date(Date.now() - value * 24 * 60 * 60 * 1000);
      if (operator === '<' || operator === '<=') {
        return { last_order_at: { gte: dateTarget } };
      } else if (operator === '>' || operator === '>=') {
        return { last_order_at: { lte: dateTarget } };
      }
    }

    let prismaOp;
    switch (operator) {
      case '>': prismaOp = 'gt'; break;
      case '>=': prismaOp = 'gte'; break;
      case '<': prismaOp = 'lt'; break;
      case '<=': prismaOp = 'lte'; break;
      case '==': 
      case '=': prismaOp = 'equals'; break;
      case '!=': prismaOp = 'not'; break;
      case 'contains': prismaOp = 'contains'; break;
      default: prismaOp = 'equals';
    }

    return {
      [field]: { [prismaOp]: value }
    };
  });

  const logicalOp = (rules.logicalOperator || 'AND').toUpperCase();
  
  if (logicalOp === 'OR') {
    return { OR: prismaConditions };
  } else {
    return { AND: prismaConditions };
  }
}

async function previewSegment(rulesJson) {
  const whereClause = buildPrismaWhereClause(rulesJson);
  
  const [count, sample] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
      where: whereClause,
      take: 10,
      orderBy: { total_spend: 'desc' }
    })
  ]);

  return { count, sample };
}

async function getSegmentCustomerIds(rulesJson) {
  const whereClause = buildPrismaWhereClause(rulesJson);
  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: { id: true }
  });
  return customers.map(c => c.id);
}

module.exports = {
  buildPrismaWhereClause,
  previewSegment,
  getSegmentCustomerIds
};
