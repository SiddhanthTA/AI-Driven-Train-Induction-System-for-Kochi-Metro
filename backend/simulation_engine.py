import random

MAINTENANCE_MEMORY = {}
CLEANING_MEMORY = {}

SERVICE_KM_MEAN = 165
SERVICE_KM_VAR = 25
STANDBY_KM_MEAN = 20
STANDBY_KM_VAR = 20

FAILURE_BASE_PROB = 0.008
HIGH_MILEAGE_FAILURE_MULTIPLIER = 1.8
VERY_HIGH_MILEAGE_FAILURE_MULTIPLIER = 2.5


def advance_one_day(
    trains,
    service_list,
    standby_list,
    maintenance_list,
    active_maintenance_names=None,
    cleaning_list=None,
    active_cleaning_names=None
):
    service_names = {t["train"] for t in service_list}
    standby_names = {t["train"] for t in standby_list}
    maintenance_reasons = {t["train"]: t["category"] for t in maintenance_list}
    cleaning_names = {t["train"] for t in (cleaning_list or [])}
    withheld_names = set(maintenance_reasons) | cleaning_names

    active_maintenance = set(active_maintenance_names) if active_maintenance_names is not None else set(maintenance_reasons)
    active_cleaning = set(active_cleaning_names) if active_cleaning_names is not None else cleaning_names

    for train in trains:
        if train.name not in cleaning_names:
            train.days_since_cleaning += 1

        # Certificate expiry continues outside workshop/cleaning queues.
        if train.name not in withheld_names:
            for field in ("fitness_rs_expiry_days", "fitness_signalling_expiry_days", "fitness_telecom_expiry_days"):
                value = getattr(train, field)
                if value is not None:
                    setattr(train, field, value - 1)
            if train.fitness_rs_expiry_days is not None and train.fitness_rs_expiry_days <= 0:
                train.fitness_rs = False
            if train.fitness_signalling_expiry_days is not None and train.fitness_signalling_expiry_days <= 0:
                train.fitness_signalling = False
            if train.fitness_telecom_expiry_days is not None and train.fitness_telecom_expiry_days <= 0:
                train.fitness_telecom = False

        if train.contract_days_remaining is not None and train.name not in withheld_names:
            train.contract_days_remaining -= 1

        if train.name in service_names:
            km = random.gauss(SERVICE_KM_MEAN, SERVICE_KM_VAR)
            train.mileage += max(0, km)
            train.predicted_maintenance_risk = max(0, train.predicted_maintenance_risk - 0.03)

        elif train.name in standby_names:
            km = random.gauss(STANDBY_KM_MEAN, STANDBY_KM_VAR)
            train.mileage += max(0, km)
            train.predicted_maintenance_risk = max(0, train.predicted_maintenance_risk - 0.01)

        elif train.name in maintenance_reasons and train.name in active_maintenance:
            days = MAINTENANCE_MEMORY.get(train.name, 0) + 1
            MAINTENANCE_MEMORY[train.name] = days
            # Two active simulated days is a prototype assumption, not a KMRL standard.
            if days >= 2:
                train.open_job_card = False
                train.sensor_alert = False
                train.fitness_rs = True
                train.fitness_signalling = True
                train.fitness_telecom = True
                validity = 25 if train.is_branded else 35
                train.fitness_rs_expiry_days = validity
                train.fitness_signalling_expiry_days = validity
                train.fitness_telecom_expiry_days = validity
                train.days_since_cleaning = 0
                train.mileage = 15000 + random.randint(-500, 500)
                train.predicted_maintenance_risk = max(0, train.predicted_maintenance_risk - 0.2)
                MAINTENANCE_MEMORY.pop(train.name, None)

        elif train.name in cleaning_names and train.name in active_cleaning:
            days = CLEANING_MEMORY.get(train.name, 0) + 1
            CLEANING_MEMORY[train.name] = days
            # One active simulated day is a prototype assumption, not an operational standard.
            if days >= 1:
                train.days_since_cleaning = 0
                train.predicted_maintenance_risk = max(0, train.predicted_maintenance_risk - 0.07)
                CLEANING_MEMORY.pop(train.name, None)

        # Avoid injecting new defects into trains already withheld from service.
        if train.name not in withheld_names:
            cert_failure_prob = 0.0005 if train.mileage < 20000 else 0.0015 if train.mileage < 26000 else 0.003
            if random.random() < cert_failure_prob:
                failed_cert = random.choice(["rs", "signalling", "telecom"])
                if failed_cert == "rs":
                    train.fitness_rs = False
                elif failed_cert == "signalling":
                    train.fitness_signalling = False
                else:
                    train.fitness_telecom = False

            failure_prob = FAILURE_BASE_PROB
            if train.mileage > 28000:
                failure_prob *= VERY_HIGH_MILEAGE_FAILURE_MULTIPLIER
            elif train.mileage > 26000:
                failure_prob *= HIGH_MILEAGE_FAILURE_MULTIPLIER
            if random.random() < failure_prob:
                train.sensor_alert = True
                train.predicted_maintenance_risk = min(1, train.predicted_maintenance_risk + 0.15)

            if train.sensor_alert or not train.fitness_rs or not train.fitness_signalling or not train.fitness_telecom:
                train.open_job_card = True

    # ---------------- BRANDING CONTRACT COMPLETION ----------------
        # if train.is_branded and train.contract_total_exposure is not None:
        #     if train.exposure_achieved >= train.contract_total_exposure:

        #         # close contract
        #         train.is_branded = False
        #         train.contract_total_exposure = None
        #         train.contract_days_remaining = None
        #         train.exposure_achieved = 0

        # ---------------- NEW CONTRACT ROTATION (FLEET LEVEL) ----------------
        

        # ================= SERVICE =================
        if train.name in service_names:

            km = random.gauss(SERVICE_KM_MEAN, SERVICE_KM_VAR)
            train.mileage += max(0, km)

            # good performance reduces risk slightly
            train.predicted_maintenance_risk = max(
                0,
                train.predicted_maintenance_risk - 0.03
            )

        # ================= STANDBY =================
        elif train.name in standby_names:

            km = random.gauss(STANDBY_KM_MEAN, STANDBY_KM_VAR)
            train.mileage += max(0, km)

            train.predicted_maintenance_risk = max(
                0,
                train.predicted_maintenance_risk - 0.01
            )

        # ================= MAINTENANCE =================
        elif train.name in maintenance_reason:
            reason=maintenance_reason[train.name]

            days = MAINTENANCE_MEMORY.get(train.name, 0)

            if reason == "cleaning":
                repair_prob = min(0.95, 0.6 + days * 0.12)
            else:
                repair_prob = min(0.8, 0.3 + days * 0.07)

            if random.random() < repair_prob:
                train.open_job_card = False
                train.sensor_alert = False

                if reason == "cleaning":

                    train.days_since_cleaning = 0
                    train.predicted_maintenance_risk = max(
                        0,
                        train.predicted_maintenance_risk - 0.07
                    )

                else:

                    train.fitness_rs = True
                    train.fitness_signalling = True
                    train.fitness_telecom = True

                    if train.is_branded:
                        validity = 25
                    else:
                        validity = 35

                    train.fitness_rs_expiry_days = validity
                    train.fitness_signalling_expiry_days = validity
                    train.fitness_telecom_expiry_days = validity

                    train.days_since_cleaning = 0
                    train.mileage = 15000 + random.randint(-500, 500)

                    train.predicted_maintenance_risk = max(
                        0,
                        train.predicted_maintenance_risk - 0.2
                    )

                # remove from maintenance memory
                if train.name in MAINTENANCE_MEMORY:
                    del MAINTENANCE_MEMORY[train.name]

            else:
                MAINTENANCE_MEMORY[train.name]=MAINTENANCE_MEMORY.get(train.name,0) + 1

        # ---------------- RARE CERTIFICATE RANDOM FAILURE ----------------
        cert_failure_prob = 0

        if train.mileage < 20000:
            cert_failure_prob = 0.0005
        elif train.mileage < 26000:
            cert_failure_prob = 0.0015
        else:
            cert_failure_prob = 0.003

        if random.random() < cert_failure_prob:
            failed_cert = random.choice(["rs", "signalling", "telecom"])
            if failed_cert == "rs":
                train.fitness_rs = False
            elif failed_cert == "signalling":
                train.fitness_signalling = False
            else:
                train.fitness_telecom = False

        # ---------------- AUTO JOB CARD TRIGGER ----------------
        

        # ================= FAILURE EMERGENCE =================

        failure_prob = FAILURE_BASE_PROB

        if train.mileage > 28000:
            failure_prob *= VERY_HIGH_MILEAGE_FAILURE_MULTIPLIER
        elif train.mileage > 26000:
            failure_prob *= HIGH_MILEAGE_FAILURE_MULTIPLIER

        if random.random() < failure_prob:
            train.sensor_alert = True
            train.predicted_maintenance_risk = min(
                1,
                train.predicted_maintenance_risk + 0.15
            )
        
        if train.sensor_alert or not train.fitness_rs or not train.fitness_signalling or not train.fitness_telecom:
            train.open_job_card = True


    # ---------------- BRANDING CONTRACT COMPLETION (RUN ONCE PER DAY) ----------------
    for train in trains:
        if train.is_branded and train.contract_total_exposure is not None:
            if train.exposure_achieved >= train.contract_total_exposure:
                train.is_branded = False
                train.contract_total_exposure = None
                train.contract_days_remaining = None
                train.exposure_achieved = 0

    fleet_size = len(trains)
    max_branded = int(0.3 * fleet_size)

    current_branded = len([t for t in trains if t.is_branded])

    if current_branded < max_branded:

        if random.random() < 0.25:   # contract arrival probability

            candidates = [t for t in trains if not t.is_branded]

            if candidates:
                new_train = random.choice(candidates)

                new_target = random.randint(80, 140)
                daily_rate = random.uniform(1.1, 1.5)
                new_days = round(new_target / daily_rate)

                new_train.is_branded = True
                new_train.contract_total_exposure = new_target
                new_train.contract_days_remaining = new_days
                new_train.exposure_achieved = 0