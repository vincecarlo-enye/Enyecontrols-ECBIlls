$path = 'C:\xampp\htdocs\Enyecontrols-ECBIlls\src\pages\admin\Tenants.jsx'
$content = [System.IO.File]::ReadAllText($path)
$content = $content.Replace("  CalendarDays,`r`n  Building2,", "  CalendarDays,`r`n  Building2,`r`n  X,")
$content = $content.Replace("  unit_id: '',`r`n  name: '',", "  unit_id: '',`r`n  extra_unit_ids: [''],`r`n  name: '',")
$content = $content.Replace("  const activeCount = tenants.filter((tenant) => tenant.status === 'active').length`r`n  const multiUnitCount = Object.values(tenantUnitMap).filter((unitList) => unitList.length > 1).length`r`n  const currentEditUnits = drawerMode === 'edit' ? (tenantUnitMap[String(form.user_id || '')] || []).filter(Boolean) : []", @"
  const activeCount = tenants.filter((tenant) => tenant.status === 'active').length
  const multiUnitCount = Object.values(tenantUnitMap).filter((unitList) => unitList.length > 1).length
  const currentEditUnits = drawerMode === 'edit' ? (tenantUnitMap[String(form.user_id || '')] || []).filter(Boolean) : []
  const occupiedByOtherUsers = useMemo(() => {
    const currentUserId = String(form.user_id || '')
    return new Set(
      tenants
        .filter((tenant) => String(tenant.user_id || '') !== currentUserId)
        .flatMap((tenant) => {
          const result = []
          if (tenant.unit?.id) result.push(String(tenant.unit.id))
          if (tenant.unit_id) result.push(String(tenant.unit_id))
          if (Array.isArray(tenant.units)) {
            tenant.units.forEach((unit) => {
              if (unit?.id) result.push(String(unit.id))
            })
          }
          return result
        })
    )
  }, [tenants, form.user_id])
  const extraAssignedIds = (form.extra_unit_ids || []).filter(Boolean).map(String)
  const linkedUnitIds = currentEditUnits.map((unit) => String(unit?.id || '')).filter(Boolean)
  const availableExtraUnits = units.filter((unit) => {
    const unitId = String(unit.id)
    if (linkedUnitIds.includes(unitId)) return false
    if (occupiedByOtherUsers.has(unitId)) return false
    return true
  })
"@)
$content = $content.Replace("      user_id: tenant.user_id || '',`r`n      unit_id: tenant.unit_id || '',`r`n      name: tenant.name || '',", "      user_id: tenant.user_id || '',`r`n      unit_id: tenant.unit_id || '',`r`n      extra_unit_ids: [''],`r`n      name: tenant.name || '',")
$content = $content.Replace("    if (!form.user_id) nextErrors.user_id = 'Tenant user is required'`r`n    if (!form.name.trim()) nextErrors.name = 'Name is required'`r`n    setErrors(nextErrors)", @"
    if (!form.user_id) nextErrors.user_id = 'Tenant user is required'
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (drawerMode === 'edit') {
      const chosenExtra = [...new Set((form.extra_unit_ids || []).filter(Boolean).map(String))]
      if (chosenExtra.length !== extraAssignedIds.length) nextErrors.extra_unit_ids = 'Duplicate extra units are not allowed'
    }
    setErrors(nextErrors)
"@)
$content = $content.Replace("      if (drawerMode === 'add') {`r`n        await addTenant(payload)`r`n      } else {`r`n        await editTenant(editingId, payload)`r`n      }", @"
      if (drawerMode === 'add') {
        await addTenant(payload)
      } else {
        await editTenant(editingId, payload)
        const newExtraUnitIds = [...new Set((form.extra_unit_ids || []).filter(Boolean).map((id) => Number(id)))]
        for (const extraUnitId of newExtraUnitIds) {
          await addTenant({
            ...payload,
            unit_id: extraUnitId,
          })
        }
        await loadTenants()
      }
"@)
$content = $content.Replace("  const handleDelete = async () => {`r`n    if (!deletingId) return`r`n    try {`r`n      await removeTenant(deletingId)`r`n      setDeletingId(null)`r`n    } catch (err) {`r`n      console.error(err)`r`n    }`r`n  }`r`n`r`n  const fieldCls = (err) =>", @"
  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await removeTenant(deletingId)
      setDeletingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const addExtraUnitRow = () => {
    setForm((current) => ({
      ...current,
      extra_unit_ids: [...(current.extra_unit_ids || ['']), ''],
    }))
  }

  const removeExtraUnitRow = (index) => {
    setForm((current) => {
      const next = (current.extra_unit_ids || ['']).filter((_, rowIndex) => rowIndex !== index)
      return {
        ...current,
        extra_unit_ids: next.length > 0 ? next : [''],
      }
    })
  }

  const setExtraUnitAtIndex = (index, value) => {
    setForm((current) => {
      const next = [...(current.extra_unit_ids || [''])]
      next[index] = value
      return {
        ...current,
        extra_unit_ids: next,
      }
    })
  }

  const fieldCls = (err) =>
"@)
$addUnitsSection = @"

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Add More Units</label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>

                <div className="space-y-2">
                  {(form.extra_unit_ids || ['']).map((unitId, index) => {
                    const chosenByOtherRows = extraAssignedIds.filter((value, valueIndex) => valueIndex !== index)
                    const options = availableExtraUnits.filter((unit) => !chosenByOtherRows.includes(String(unit.id)) || String(unit.id) === String(unitId))

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={unitId}
                          onChange={(event) => setExtraUnitAtIndex(index, event.target.value)}
                          className={`${fieldCls(false)} flex-1`}
                        >
                          <option value="">- Select additional unit -</option>
                          {options.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unit_number} ({unit.building_name || '-'}, Floor {unit.floor || '-'})
                            </option>
                          ))}
                        </select>

                        {(form.extra_unit_ids || []).length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeExtraUnitRow(index)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                            title="Remove extra unit row"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {errors.extra_unit_ids ? <p className="mt-1 text-xs text-red-500">{errors.extra_unit_ids}</p> : null}

                <button
                  type="button"
                  onClick={addExtraUnitRow}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Unit Row
                </button>
              </div>
"@
$content = $content.Replace('              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900/40 dark:bg-blue-900/20">', $addUnitsSection + "`r`n              <div className=""rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900/40 dark:bg-blue-900/20"">")
$content = $content.Replace('                  Additional unit links shown here are based on the same tenant user. This edit form updates the current tenant record and its primary assigned unit only.', '                  Saving this form will keep the current tenant record updated and create additional linked tenant records for any extra units you add here.')
[System.IO.File]::WriteAllText($path, $content)
