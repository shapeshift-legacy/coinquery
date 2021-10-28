-- Deploy ss2:function-block-insert to pg
-- requires: schema
-- requires: table-block

BEGIN;

-- deploy new function
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
        in_last_block_hash block.last_block_hash%TYPE := in_block->>'previousblockhash';
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

        var_last_block_hash block.block_hash%TYPE;
        var_last_block_orphaned block.is_orphaned%TYPE;
        var_last_block_height block.height%TYPE;
        var_id block.id%TYPE;
        var_current_block_hash block.block_hash%TYPE;
        var_current_block_height block.height%TYPE;
        var_missing_ancestor BOOLEAN := FALSE;
        var_next_block_hash block.block_hash%TYPE;
        var_prev_block_hash block.block_hash%TYPE;
        var_prev_block_height block.height%TYPE;
    BEGIN
        -- Get the last saved block
        SELECT height INTO var_last_block_height
            FROM block
            WHERE is_orphaned = false
            ORDER BY height DESC
            LIMIT 1;

        -- Check if this block is equal to or greater than the last saved block height
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

            -- Set next_block_hash of previous block if it is empty
            UPDATE block
                SET next_block_hash = in_block_hash
                WHERE block_hash = var_prev_block_hash
                AND height = var_prev_block_height
                AND next_block_hash = '';
        END IF;

        -- Idempotency check, update block to is_orphaned = false and return if exists already
        UPDATE block
            SET is_orphaned = FALSE
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
            in_last_block_hash,
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

        -- There is no last saved block, just insert
        IF var_last_block_height IS NOT NULL THEN
            SELECT block_hash, height, is_orphaned INTO var_last_block_hash, var_last_block_height, var_last_block_orphaned
                FROM block
                WHERE block_hash = in_last_block_hash;

            -- Missing ancestor, start revert descendants loop
            IF var_last_block_hash IS NULL THEN
                var_missing_ancestor := TRUE;
                var_next_block_hash := in_block_hash;
                var_last_block_height := in_height - 1;
            END IF;

            -- Go back in the chain and set all other blocks is_orphaned = true which are not on this chain
            WHILE var_missing_ancestor = FALSE AND var_last_block_orphaned = TRUE LOOP
                -- Hold current block for missing ancestor check
                var_current_block_hash := var_last_block_hash;
                var_current_block_height := var_last_block_height;

                -- Orphan all other blocks at this height
                UPDATE block
                    SET is_orphaned = true
                    WHERE block_hash != var_last_block_hash
                    AND height = var_last_block_height;

                -- Set block to is_orphaned = false and return the last_block_hash
                UPDATE block
                    SET is_orphaned = false
                    WHERE block_hash = var_last_block_hash
                    AND height = var_last_block_height
                    RETURNING last_block_hash INTO var_last_block_hash;

                SELECT block_hash, height, is_orphaned INTO var_last_block_hash, var_last_block_height, var_last_block_orphaned
                    FROM block
                    WHERE block_hash = var_last_block_hash;

                -- Missing ancestor, start revert descendants loop
                IF var_last_block_hash IS NULL THEN
                    var_missing_ancestor := TRUE;
                    var_next_block_hash := var_current_block_hash;
                    var_last_block_height := var_current_block_height - 1;
                END IF;
            END LOOP;

            -- We are missing an ancestor on the correct side of the chain, orphan all
            -- the blocks that are descendants of the missing block
            IF var_missing_ancestor = TRUE THEN
                -- Still need to orphan all blocks at height - 1
                UPDATE block
                    SET is_orphaned = true
                    WHERE height = var_last_block_height;

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
