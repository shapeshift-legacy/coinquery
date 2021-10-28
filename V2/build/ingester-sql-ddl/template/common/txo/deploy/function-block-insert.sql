-- Deploy ss2:function-block-insert to pg
-- requires: schema
-- requires: table-block

BEGIN;

CREATE OR REPLACE FUNCTION <%=schema%>.block_insert (
    IN in_block jsonb,
    IN in_mined_time <%=schema%>.block.mined_time%TYPE,
    IN in_median_time <%=schema%>.block.median_time%TYPE,
    IN in_recover BOOLEAN
) RETURNS BIGINT AS $$
    DECLARE
        in_block_hash block.block_hash%TYPE := in_block->>'hash';
        in_height block.height%TYPE := in_block->>'height';
        in_nonce block.nonce%TYPE := in_block->>'nonce';
        in_prev_block_hash block.last_block_hash%TYPE := in_block->>'previousblockhash';
        in_next_block_hash block.next_block_hash%TYPE := in_block->>'nextblockhash';
        in_bits block.bits%TYPE := in_block->>'bits';
        in_difficulty block.difficulty%TYPE := in_block->>'difficulty';
        in_chainwork block.chainwork%TYPE := in_block->>'chainwork';
        in_version block.version%TYPE := in_block->>'version';
        in_version_hex block.version_hex%TYPE := in_block->>'versionHex';
        in_merkle_root block.merkle_root%TYPE := in_block->>'merkleroot';
        in_size block.size%TYPE := in_block->>'size';
        in_stripped_size block.stripped_size%TYPE := in_block->>'strippedsize';
        in_weight block.weight%TYPE := in_block->>'weight';
        in_tx_count block.tx_count%TYPE := in_block->>'nTx';

        var_id block.id%TYPE;
        var_current_block_hash block.block_hash%TYPE;
        var_current_block_height block.height%TYPE;
        var_next_block_hash block.block_hash%TYPE;
        var_prev_block_hash block.block_hash%TYPE;
        var_prev_block_height block.height%TYPE;
        var_prev_block_orphaned block.is_orphaned%TYPE;
        var_last_block_height block.height%TYPE;
        var_missing_ancestor BOOLEAN := FALSE;
    BEGIN
        -- Get the last non orphaned block height
        SELECT height INTO var_last_block_height
            FROM block
            WHERE is_orphaned = false
            ORDER BY height DESC
            LIMIT 1;

        -- Check if block is equal to or greater than the last saved block height
        IF in_height < var_last_block_height AND in_recover = FALSE THEN
            RAISE EXCEPTION 'Received block hash: % is less than current last block height: %.', in_block_hash, var_last_block_height;
        END IF;

        -- Handle updating next_block_hash if block height is not 0
        IF in_height > 0 THEN
            var_prev_block_height := in_height - 1;

            -- Get the previous block hash
            SELECT block_hash INTO var_prev_block_hash
                FROM block
                WHERE is_orphaned = FALSE
                AND height = var_prev_block_height;

            -- Set next_block_hash of previous block
            UPDATE block
                SET next_block_hash = in_block_hash
                WHERE block_hash = var_prev_block_hash
                AND height = var_prev_block_height
                AND next_block_hash != in_block_hash
                AND is_orphaned = FALSE;
        END IF;

        -- Idempotency check, update block to not orphaned and ensure correct next block hash. Return id if exists
        UPDATE block
            SET (next_block_hash, is_orphaned) = (in_next_block_hash, FALSE)
            WHERE block_hash = in_block_hash
            AND height = in_height
            RETURNING id INTO var_id;

        -- Orphan all other blocks at this height
        UPDATE block
            SET is_orphaned = true
            WHERE block_hash != in_block_hash
            AND height = in_height;

        IF var_id IS NOT NULL THEN
            RETURN var_id;
        END IF;

        -- Insert new block
        INSERT INTO block (
            block_hash,
            height,
            mined_time,
            median_time,
            nonce,
            last_block_hash,
            next_block_hash,
            bits,
            difficulty,
            chainwork,
            version,
            version_hex,
            merkle_root,
            size,
            stripped_size,
            weight,
            tx_count
        ) VALUES (
            in_block_hash,
            in_height,
            in_mined_time,
            in_median_time,
            in_nonce,
            in_prev_block_hash,
            in_next_block_hash,
            in_bits,
            in_difficulty,
            in_chainwork,
            in_version,
            in_version_hex,
            in_merkle_root,
            in_size,
            in_stripped_size,
            in_weight,
            in_tx_count
        ) RETURNING id INTO var_id;

        -- Validate ancestors
        IF var_last_block_height IS NOT NULL THEN
            -- Keep track of current block hash for parent ancestor's next_block_hash
            var_next_block_hash := in_block_hash;

            -- Look up parent ancestor of current block
            SELECT block_hash, height, is_orphaned INTO var_prev_block_hash, var_prev_block_height, var_prev_block_orphaned
                FROM block
                WHERE block_hash = in_prev_block_hash;

            -- Check if parent ancestor was found
            IF var_prev_block_hash IS NULL THEN
                var_missing_ancestor := TRUE;
                var_prev_block_height := in_height - 1;
            END IF;

            -- No missing parent ancestor, but wrong side of chain
            WHILE var_missing_ancestor = FALSE AND var_prev_block_orphaned = TRUE LOOP
                -- Update our current block to parent ancestor
                var_current_block_hash := var_prev_block_hash;
                var_current_block_height := var_prev_block_height;

                -- Orphan siblings at current height
                UPDATE block
                    SET (next_block_hash, is_orphaned) = ('', TRUE)
                    WHERE block_hash != var_current_block_hash
                    AND height = var_current_block_height;

                -- Set current block to not orphaned and update next_block_hash with child ancestor block_hash
                -- Keep track of current block hash for parent ancestor's next_block_hash
                UPDATE block
                    SET (next_block_hash, is_orphaned) = (var_next_block_hash, FALSE)
                    WHERE block_hash = var_current_block_hash
                    AND height = var_current_block_height
                    RETURNING block_hash, last_block_hash INTO var_next_block_hash, var_prev_block_hash;

                var_prev_block_height := var_current_block_height - 1;

                -- Update next_block_hash of current block's parent ancestor to current block's block_hash
                -- Look up parent ancestor of current block
                UPDATE block
                    SET next_block_hash = var_next_block_hash
                    WHERE block_hash = var_prev_block_hash
                    AND height = var_prev_block_height
                    RETURNING block_hash, height, is_orphaned INTO var_prev_block_hash, var_prev_block_height, var_prev_block_orphaned;

                -- Check if parent ancestor was found
                IF var_prev_block_hash IS NULL THEN
                    var_missing_ancestor := TRUE;
                    var_prev_block_height := var_current_block_height - 1;
                END IF;
            END LOOP;

            -- Missing ancestor
            IF var_missing_ancestor = TRUE THEN
                -- Orphan all blocks at previous height of current block
                UPDATE block
                    SET is_orphaned = true
                    WHERE height = var_prev_block_height;

                -- Orphan current block and all children
                WHILE var_next_block_hash IS NOT NULL LOOP
                    UPDATE block
                        SET is_orphaned = true
                        WHERE block_hash = var_next_block_hash;

                    SELECT block_hash INTO var_next_block_hash
                        FROM block
                        WHERE last_block_hash = var_next_block_hash;
                END LOOP;
            END IF;
        END IF;

        RETURN var_id;
    END
$$ LANGUAGE PLPGSQL VOLATILE
SET search_path=<%=schema%>;

COMMIT;
