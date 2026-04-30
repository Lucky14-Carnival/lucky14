import { apiRequest } from "../lib/api/client";

const API_PREFIX = "/api/v1";

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoDate = (value) => {
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return formatLocalDate(parsed);
};

const money = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const cleanText = (value) => String(value ?? "").trim().replace(/\s{2,}/g, " ");

const sortReportsDescending = (items = []) =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.reportDate || left.generatedAt || 0).getTime();
    const rightTime = new Date(right.reportDate || right.generatedAt || 0).getTime();
    return rightTime - leftTime;
  });

const summarizeTransactions = (transactions, type) =>
  transactions
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + money(item.amount), 0);

const summarizePendingBorrowedFunds = (transactions) =>
  transactions
    .filter((item) => item.type === "BORROWED_FUND" && !item.approved)
    .reduce((sum, item) => sum + money(item.amount), 0);

const getTodayIsoDate = () => formatLocalDate(new Date());
const buildBranchName = (branch) =>
  branch
    ? [branch.barangay, branch.municipality, branch.province].filter(Boolean).join(", ")
    : "";
const getLatestTransaction = (items = []) =>
  [...items].sort(
    (left, right) =>
      new Date(right.transactionDate || 0).getTime() - new Date(left.transactionDate || 0).getTime()
  )[0] || null;

const getAllTransactions = (branchId) =>
  apiRequest(`${API_PREFIX}/transactions/getAllBorrows`, {
    params: { branchId },
  });

const getTransactionsForDate = (branchId, date) =>
  apiRequest(`${API_PREFIX}/transactions/getAllBorrows`, {
    params: {
      branchId,
      date: toIsoDate(date),
    },
  });

const getAllAttractionsRaw = () => apiRequest(`${API_PREFIX}/attractions/getAllAttractions`);
const getAllReportsRaw = (branchId, from, to) =>
  apiRequest(`${API_PREFIX}/reports/getAllReports`, {
    params: {
      branchId,
      from: toIsoDate(from),
      to: toIsoDate(to),
    },
  });

export const getDashboardSummary = async ({ branchId } = {}) => {
  const reportDate = getTodayIsoDate();
  const [todayTransactions, allTransactions, attractions, reports, branches] = await Promise.all([
    getTransactionsForDate(branchId, reportDate),
    getAllTransactions(branchId),
    getAllAttractionsRaw(),
    getAllReportsRaw(branchId, reportDate, reportDate),
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
  ]);

  const budgetAllocated = attractions
    .filter((item) => branchId == null || item.branchId === Number(branchId))
    .reduce((sum, item) => sum + money(item.budget), 0);
  const actualSpent = attractions
    .filter((item) => branchId == null || item.branchId === Number(branchId))
    .reduce((sum, item) => sum + money(item.spentBudget), 0);
  const reportItems = Array.isArray(reports) ? reports : [];
  const latestReport = sortReportsDescending(reportItems)[0] || null;
  const branch = branches.find((item) => item.id === Number(branchId));
  const branchName = buildBranchName(branch) || (latestReport?.branchId ? `Branch ${latestReport.branchId}` : "");
  const hasFinalizedToday = Boolean(latestReport?.finalized);
  const todayRevenue = hasFinalizedToday ? 0 : summarizeTransactions(todayTransactions, "REVENUE");
  const totalExpenses = hasFinalizedToday ? 0 : summarizeTransactions(todayTransactions, "EXPENSE");
  const pendingFunds = summarizePendingBorrowedFunds(allTransactions);

  return {
    reportId: latestReport?.id ?? null,
    todayRevenue,
    totalExpenses,
    pendingFunds,
    budgetAllocated,
    actualSpent,
    isFinalized: Boolean(latestReport?.finalized),
    reportDate,
    branchName,
  };
};

export const finalizeDashboardReport = (payload) =>
  apiRequest(`${API_PREFIX}/reports/addReport`, {
    method: "POST",
    params: {
      generatedByUserId: payload.userId,
    },
    body: {
      branchId: payload.branchId,
      reportDate: toIsoDate(payload.date),
      finalizeReport: false,
    },
    headers: {
      "Content-Type": "application/json",
    },
  }).then((report) =>
    apiRequest(`${API_PREFIX}/reports/updateReportById`, {
      method: "PATCH",
      params: {
        id: report.id,
        finalizedByUserId: payload.userId,
      },
    })
  );

export const getRevenueRecords = async ({ branchId } = {}) => {
  const items = await apiRequest(`${API_PREFIX}/transactions/getAllBorrows`, {
    params: {
      branchId,
      type: "REVENUE",
    },
  });

  return items.map((item) => ({
    id: String(item.id),
    date: item.transactionDate ? new Date(item.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    source: item.attractionName || item.remarks || "",
    amount: String(item.amount ?? ""),
    _meta: item,
  }));
};
export const saveRevenueRecords = (records) =>
  Promise.all(
    records
      .filter((item) => item._meta?.id)
      .map((item) =>
        apiRequest(`${API_PREFIX}/transactions/updateBorrowById`, {
          method: "PATCH",
          params: {
            id: item._meta.id,
            branchId: item._meta.branchId,
          },
          body: {
            branchId: item._meta.branchId,
            userId: item._meta.userId,
            attractionId: item._meta.attractionId,
            type: "REVENUE",
            amount: money(item.amount),
            hasReceipt: Boolean(item._meta.hasReceipt),
            remarks: cleanText(item.source),
            transactionDate: item._meta.transactionDate,
          },
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
  );

export const getBudgetItems = async ({ branchId } = {}) => {
  const [attractions, transactions] = await Promise.all([
    getAllAttractionsRaw(),
    getAllTransactions(branchId),
  ]);

  const scopedAttractions = attractions.filter((item) => branchId == null || item.branchId === Number(branchId));
  return scopedAttractions.map((item) => {
    const computedSpent = transactions
      .filter((txn) => txn.attractionId === item.id && txn.type === "EXPENSE")
      .reduce((sum, txn) => sum + money(txn.amount), 0);
    const storedSpent = money(item.spentBudget);

    return {
      id: String(item.id),
      date: "",
      category: cleanText(item.name),
      allocated: String(item.budget ?? 0),
      spent: String(storedSpent || computedSpent),
      _meta: item,
      _branchId: item.branchId,
    };
  });
};
export const saveBudgetItems = (items) =>
  Promise.all(
    [
      ...items
      .filter((item) => item._meta?.id)
      .map((item) =>
        apiRequest(`${API_PREFIX}/attractions/updateAttractionById`, {
          method: "PATCH",
          params: { id: item._meta.id },
          body: {
            branchId: item._meta.branchId,
            name: cleanText(item.category),
            budget: money(item.allocated),
            spentBudget: money(item.spent),
            active: item._meta.active ?? true,
          },
          headers: {
            "Content-Type": "application/json",
          },
        })
      ),
      ...items
      .filter((item) => !item._meta?.id && item.category?.trim())
      .map((item) =>
        apiRequest(`${API_PREFIX}/attractions/addAttraction`, {
          method: "POST",
          body: {
            branchId: Number(item._branchId),
            name: cleanText(item.category),
            budget: money(item.allocated),
            spentBudget: money(item.spent),
            active: true,
          },
          headers: {
            "Content-Type": "application/json",
          },
        })
      ),
    ]
  );

export const getAttractionExpenses = async ({ branchId } = {}) => {
  const reportDate = getTodayIsoDate();
  const [attractions, transactions] = await Promise.all([
    getAllAttractionsRaw(),
    getTransactionsForDate(branchId, reportDate),
  ]);

  return attractions
    .filter((item) => branchId == null || item.branchId === Number(branchId))
    .map((item) => {
      const expenseTransactions = transactions.filter(
        (txn) => txn.attractionId === item.id && txn.type === "EXPENSE"
      );
      const revenueTransactions = transactions.filter(
        (txn) => txn.attractionId === item.id && txn.type === "REVENUE"
      );
      const expense = expenseTransactions.reduce((sum, txn) => sum + money(txn.amount), 0);
      const revenue = revenueTransactions.reduce((sum, txn) => sum + money(txn.amount), 0);
      const profit = revenue - expense;

      return {
        id: String(item.id),
        date: reportDate,
        source: cleanText(item.name),
        expense: String(expense),
        profit: String(profit),
        _meta: item,
        _expenseTransactions: expenseTransactions,
        _revenueTransactions: revenueTransactions,
      };
    });
};
export const saveAttractionExpenses = async (items, { branchId, userId } = {}) => {
  const normalizedBranchId = Number(branchId);
  const normalizedUserId = Number(userId);
  const reportDate = getTodayIsoDate();

  if (!normalizedBranchId || !normalizedUserId) {
    throw new Error("Admin branch and user information are required to save attraction expenses.");
  }

  const requests = items
    .filter((item) => item._meta?.id)
    .flatMap((item) => {
      const normalizedAmount = money(item.expense);
      const normalizedProfit = money(item.profit);
      const normalizedRevenue = Math.max(0, normalizedAmount + normalizedProfit);
      const normalizedSource = cleanText(item.source);
      const attractionUpdate = apiRequest(`${API_PREFIX}/attractions/updateAttractionById`, {
        method: "PATCH",
        params: { id: item._meta.id },
        body: {
          branchId: item._meta.branchId,
          name: normalizedSource || cleanText(item._meta?.name),
          budget: item._meta.budget,
          spentBudget: normalizedAmount,
          active: item._meta.active ?? true,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const expenseTransactions = Array.isArray(item._expenseTransactions) ? item._expenseTransactions : [];
      const revenueTransactions = Array.isArray(item._revenueTransactions) ? item._revenueTransactions : [];
      const [primaryExpense, ...duplicateExpenses] = expenseTransactions;
      const [primaryRevenue, ...duplicateRevenues] = revenueTransactions;

      const duplicateDeletes = duplicateExpenses.map((txn) =>
        apiRequest(`${API_PREFIX}/transactions/deleteBorrowById`, {
          method: "DELETE",
          params: {
            id: txn.id,
            branchId: txn.branchId,
          },
        })
      );
      const duplicateRevenueDeletes = duplicateRevenues.map((txn) =>
        apiRequest(`${API_PREFIX}/transactions/deleteBorrowById`, {
          method: "DELETE",
          params: {
            id: txn.id,
            branchId: txn.branchId,
          },
        })
      );

      let expenseRequest = Promise.resolve();
      if (primaryExpense) {
        expenseRequest = apiRequest(`${API_PREFIX}/transactions/updateBorrowById`, {
          method: "PATCH",
          params: {
            id: primaryExpense.id,
            branchId: primaryExpense.branchId,
          },
          body: {
            branchId: primaryExpense.branchId,
            userId: primaryExpense.userId,
            attractionId: primaryExpense.attractionId,
            type: "EXPENSE",
            amount: normalizedAmount,
            approved: Boolean(primaryExpense.approved),
            hasReceipt: true,
            remarks: normalizedSource,
            transactionDate: primaryExpense.transactionDate,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else if (normalizedAmount > 0) {
        expenseRequest = apiRequest(`${API_PREFIX}/transactions/addBorrow`, {
          method: "POST",
          body: {
            branchId: normalizedBranchId,
            userId: normalizedUserId,
            attractionId: item._meta.id,
            type: "EXPENSE",
            amount: normalizedAmount,
            approved: false,
            hasReceipt: true,
            remarks: normalizedSource,
            transactionDate: `${reportDate}T00:00:00`,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      let revenueRequest = Promise.resolve();
      if (primaryRevenue) {
        revenueRequest = apiRequest(`${API_PREFIX}/transactions/updateBorrowById`, {
          method: "PATCH",
          params: {
            id: primaryRevenue.id,
            branchId: primaryRevenue.branchId,
          },
          body: {
            branchId: primaryRevenue.branchId,
            userId: primaryRevenue.userId,
            attractionId: primaryRevenue.attractionId,
            type: "REVENUE",
            amount: normalizedRevenue,
            approved: Boolean(primaryRevenue.approved),
            hasReceipt: Boolean(primaryRevenue.hasReceipt),
            remarks: normalizedSource,
            transactionDate: primaryRevenue.transactionDate,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else if (normalizedRevenue > 0) {
        revenueRequest = apiRequest(`${API_PREFIX}/transactions/addBorrow`, {
          method: "POST",
          body: {
            branchId: normalizedBranchId,
            userId: normalizedUserId,
            attractionId: item._meta.id,
            type: "REVENUE",
            amount: normalizedRevenue,
            approved: false,
            hasReceipt: true,
            remarks: normalizedSource,
            transactionDate: `${reportDate}T00:00:00`,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      return [attractionUpdate, expenseRequest, revenueRequest, ...duplicateDeletes, ...duplicateRevenueDeletes];
    });

  await Promise.all(requests);
};

export const getBorrowedFunds = async ({ branchId } = {}) => {
  const items = await apiRequest(`${API_PREFIX}/transactions/getAllBorrows`, {
    params: {
      branchId,
      type: "BORROWED_FUND",
    },
  });

  return items.map((item) => ({
    id: String(item.id),
    date: item.transactionDate ? new Date(item.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    manager: item.userId ? `User ${item.userId}` : "",
    table: item.attractionName || "",
    amount: money(item.amount),
    isReturned: Boolean(item.approved),
    _meta: item,
  }));
};
export const saveBorrowedFunds = async (items) => {
  const hasNewRows = items.some((item) => !item._meta?.id);
  if (hasNewRows) {
    throw new Error("Creating new borrowed-fund rows needs branchId, userId, and attractionId from the backend.");
  }

  return Promise.all(
    items.map((item) =>
      apiRequest(`${API_PREFIX}/transactions/updateBorrowById`, {
        method: "PATCH",
        params: {
          id: item._meta.id,
          branchId: item._meta.branchId,
        },
        body: {
          branchId: item._meta.branchId,
          userId: item._meta.userId,
          attractionId: item._meta.attractionId,
          type: "BORROWED_FUND",
          amount: Number(item.amount || 0),
          approved: Boolean(item.isReturned),
          hasReceipt: Boolean(item._meta.hasReceipt),
          remarks: item.table,
          transactionDate: item._meta.transactionDate,
        },
        headers: {
          "Content-Type": "application/json",
        },
      })
    )
  );
};

export const getHistoryLogs = async ({ branchId } = {}) => {
  const items = sortReportsDescending(await getAllReportsRaw(branchId));
  return items.map((item) => ({
    id: String(item.id),
    date: item.reportDate,
    type: "Daily Report",
    detail: `Branch ${item.branchId} report`,
    metrics: {
      gross: money(item.totalRevenue),
      expenses: money(item.totalExpenses),
      net: money(item.profit),
    },
    user: String(item.branchId),
    finalized: Boolean(item.finalized),
  }));
};
export const deleteHistoryLog = async () => {
  throw new Error("The provided backend controllers do not expose a delete-report endpoint.");
};

export const getSuperAdminOverview = async () => {
  const [branches, reports, transactions] = await Promise.all([
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
    getAllReportsRaw(),
    getAllTransactions(),
  ]);
  const finalizedReports = reports.filter((item) => item.finalized);
  const totals = {
    revenue: summarizeTransactions(transactions, "REVENUE"),
    borrow: summarizePendingBorrowedFunds(transactions),
    net: summarizeTransactions(transactions, "REVENUE") - summarizeTransactions(transactions, "EXPENSE"),
  };

  const branchSummaries = branches.map((branch) => {
    const branchTransactions = transactions.filter((item) => item.branchId === branch.id);
    const branchReports = finalizedReports.filter((item) => item.branchId === branch.id);
    const revenue = summarizeTransactions(branchTransactions, "REVENUE");
    const expenses = summarizeTransactions(branchTransactions, "EXPENSE");
    const profit = revenue - expenses;
    const pendingBorrow = summarizePendingBorrowedFunds(branchTransactions);

    return {
      id: branch.id,
      name: [branch.barangay, branch.municipality, branch.province].filter(Boolean).join(", "),
      status: branch.active ? "Active" : "Inactive",
      revenue,
      profit,
      pendingBorrow,
      reportCount: branchReports.length,
    };
  });

  const maxRevenue = branchSummaries.reduce((max, branch) => Math.max(max, branch.revenue), 0);

  return {
    ownerName: "",
    totals,
    branches: branchSummaries.map((branch) => ({
      ...branch,
      perf: maxRevenue > 0 ? Math.round((branch.revenue / maxRevenue) * 100) : 0,
    })),
  };
};

export const getBranchAccounts = async () => {
  const [branches, users] = await Promise.all([
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
    apiRequest(`${API_PREFIX}/users/getAllUsers`),
  ]);

  return branches.map((branch) => {
    const branchUsers = users.filter((user) => user.branchId === branch.id);
    const activeUsers = branchUsers.filter((user) => user.active);

    return {
      id: branch.id,
      name: [branch.barangay, branch.municipality, branch.province].filter(Boolean).join(", ") || `Branch ${branch.id}`,
      province: branch.province || "",
      municipality: branch.municipality || "",
      barangay: branch.barangay || "",
      landmark: branch.landmark || "",
      status: branch.active ? "Active" : "Inactive",
      managerCount: branchUsers.length,
      activeUsers: activeUsers.length,
      email: branch.email || "",
      phone: branch.phone || "",
      active: Boolean(branch.active),
    };
  });
};

export const createBranchAccount = (payload) =>
  apiRequest(`${API_PREFIX}/branches/addBranch`, {
    method: "POST",
    body: {
      province: payload.province,
      municipality: payload.municipality,
      barangay: payload.barangay,
      landmark: payload.landmark || "",
      active: true,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateBranchAccount = (id, payload) =>
  apiRequest(`${API_PREFIX}/branches/updateBranchById`, {
    method: "PATCH",
    params: { id },
    body: {
      province: payload.province,
      municipality: payload.municipality,
      barangay: payload.barangay,
      landmark: payload.landmark || "",
      active: payload.active ?? true,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

export const setBranchAccountStatus = (id, action = "inactive") =>
  apiRequest(`${API_PREFIX}/branches/deleteBranchById`, {
    method: "DELETE",
    params: { id, action },
  });

export const getSuperAdminBorrowingHistory = async () => {
  const [items, branches, users] = await Promise.all([
    apiRequest(`${API_PREFIX}/transactions/getAllBorrows`, {
      params: { type: "BORROWED_FUND" },
    }),
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
    apiRequest(`${API_PREFIX}/users/getAllUsers`),
  ]);

  return items
    .filter((item) => item.type === "BORROWED_FUND")
    .map((item) => ({
    id: item.id,
    branchId: item.branchId,
    branchName: buildBranchName(branches.find((branch) => branch.id === item.branchId)),
    userId: item.userId,
    userName: users.find((user) => user.id === item.userId)?.username || users.find((user) => user.id === item.userId)?.name || "",
    attractionId: item.attractionId,
    attractionName: item.attractionName || "",
    amount: money(item.amount),
    remarks: item.remarks || "",
    date: item.transactionDate || "",
    approved: Boolean(item.approved),
  }));
};

export const getGeneratedReports = async () => {
  const [items, branches, attractions] = await Promise.all([
    getAllReportsRaw(),
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
    getAllAttractionsRaw(),
  ]);

  return sortReportsDescending(items)
    .filter((item) => item.finalized)
    .map((item) => {
    const budget = attractions
      .filter((attraction) => attraction.branchId === item.branchId)
      .reduce((sum, attraction) => sum + money(attraction.budget), 0);
    const revenue = money(item.totalRevenue);
    const expenses = money(item.totalExpenses);
    const borrowings = money(item.totalBorrowedFunds);
    const profit = money(item.profit);
    const netAfterBudget = revenue - expenses - budget;

    return {
    id: item.id,
    branchId: item.branchId,
    branchName: buildBranchName(branches.find((branch) => branch.id === item.branchId)) || `Branch ${item.branchId || "-"}`,
    date: item.reportDate || "",
    revenue,
    expenses,
    budget,
    borrowings,
    profit,
    netAfterBudget,
    finalized: Boolean(item.finalized),
  };
  });
};

export const getAdminReportById = async (id) => {
  const item = await apiRequest(`${API_PREFIX}/reports/getReportById`, {
    params: { id },
  });

  return {
    id: item.id,
    branchId: item.branchId,
    date: item.reportDate || "",
    revenue: money(item.totalRevenue),
    expenses: money(item.totalExpenses),
    borrowings: money(item.totalBorrowedFunds),
    profit: money(item.profit),
    finalized: Boolean(item.finalized),
    generatedAt: item.generatedAt || "",
  };
};

export const getLatestAdminReport = async ({ branchId } = {}) => {
  const latest = sortReportsDescending(await getAllReportsRaw(branchId))[0];

  if (!latest) {
    return null;
  }

  return {
    id: latest.id,
    branchId: latest.branchId,
    date: latest.reportDate || "",
    revenue: money(latest.totalRevenue),
    expenses: money(latest.totalExpenses),
    borrowings: money(latest.totalBorrowedFunds),
    profit: money(latest.profit),
    finalized: Boolean(latest.finalized),
    generatedAt: latest.generatedAt || "",
  };
};

export const submitTableManagerReport = async (payload) => {
  const branchId = Number(payload.branchId);
  const userId = Number(payload.userId);
  const tableName = String(payload.tableLabel || "").trim();
  const revenueAmount = money(payload.revenue);
  const reportAmount = money(payload.amount);
  const budgetAmount = payload.budgetAmount === "" ? null : money(payload.budgetAmount);

  if (!branchId || !userId) {
    throw new Error("Table manager account is missing branch or user assignment.");
  }

  if (!tableName) {
    throw new Error("Table label is required.");
  }

  const attractions = await getAllAttractionsRaw();
  const branchAttractions = attractions.filter((item) => item.branchId === branchId);
  const existingAttraction = branchAttractions.find(
    (item) => String(item.name || "").trim().toLowerCase() === tableName.toLowerCase()
  );

  let attraction = existingAttraction;

  if (!attraction) {
    attraction = await apiRequest(`${API_PREFIX}/attractions/addAttraction`, {
      method: "POST",
      body: {
        branchId,
        name: tableName,
        budget: budgetAmount ?? 0,
        active: true,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else if (budgetAmount !== null) {
    attraction = await apiRequest(`${API_PREFIX}/attractions/updateAttractionById`, {
      method: "PATCH",
      params: { id: attraction.id },
      body: {
        branchId,
        name: tableName,
        budget: budgetAmount,
        active: attraction.active ?? true,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const transactionRequests = [];

  if (revenueAmount > 0) {
    transactionRequests.push(
      apiRequest(`${API_PREFIX}/transactions/addBorrow`, {
        method: "POST",
        body: {
          branchId,
          userId,
          attractionId: attraction.id,
          type: "REVENUE",
          amount: revenueAmount,
          hasReceipt: true,
          remarks: tableName,
        },
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  }

  if (reportAmount > 0) {
    transactionRequests.push(
      apiRequest(`${API_PREFIX}/transactions/addBorrow`, {
        method: "POST",
        body: {
          branchId,
          userId,
          attractionId: attraction.id,
          type: payload.reportType === "Borrowing" ? "BORROWED_FUND" : "EXPENSE",
          amount: reportAmount,
          hasReceipt: payload.reportType === "Borrowing" ? true : true,
          remarks: String(payload.description || "").trim() || tableName,
        },
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  }

  if (!transactionRequests.length && budgetAmount === null) {
    throw new Error("Enter revenue, expense or borrowing, or budget before submitting.");
  }

  await Promise.all(transactionRequests);

  return {
    success: true,
    attractionId: attraction.id,
  };
};

export const getSuperAdminProfiles = async () => {
  const [items, branches] = await Promise.all([
    apiRequest(`${API_PREFIX}/users/getAllUsers`),
    apiRequest(`${API_PREFIX}/branches/getAllBranches`),
  ]);

  return items.map((item) => ({
    id: item.id,
    name: item.username || "",
    role: item.role || "",
    roleLabel:
      item.role === "SUPER_ADMIN" ? "Super Admin" :
      item.role === "ADMIN" ? "Admin" :
      item.role === "USER" ? "Table Manager" :
      item.role || "",
    branchId: item.branchId,
    branchName: buildBranchName(branches.find((branch) => branch.id === item.branchId)),
    email: item.email || "",
    phone: item.phone || "",
    active: Boolean(item.active),
  }));
};

export const setSuperAdminProfileStatus = (id, action = "inactive") =>
  apiRequest(`${API_PREFIX}/users/deleteUserById`, {
    method: "DELETE",
    params: { id, action },
  });

