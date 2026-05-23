package com.madeone.safetycontrol.domain;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkTypeSettingRepository extends JpaRepository<WorkTypeSetting, String> {

	List<WorkTypeSetting> findAllByOrderBySortOrderAscLabelAsc();

	List<WorkTypeSetting> findByEnabledTrueOrderBySortOrderAscLabelAsc();
}
